package io.github.dongyuns.jubjub.domain.core.payment.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.core.coupon.entity.MemberCoupon;
import io.github.dongyuns.jubjub.domain.core.coupon.repository.MemberCouponRepository;
import io.github.dongyuns.jubjub.domain.core.member.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.core.member.repository.MemberProfileRepository;
import io.github.dongyuns.jubjub.domain.core.order.entity.Order;
import io.github.dongyuns.jubjub.domain.core.order.entity.OrderStatus;
import io.github.dongyuns.jubjub.domain.core.payment.entity.Payment;
import io.github.dongyuns.jubjub.domain.core.payment.entity.PaymentCancellation;
import io.github.dongyuns.jubjub.domain.core.payment.entity.PaymentStatus;
import io.github.dongyuns.jubjub.domain.core.payment.event.PaymentApprovedEvent;
import io.github.dongyuns.jubjub.domain.customer.payment.dto.ConfirmPaymentRequest;
import io.github.dongyuns.jubjub.domain.customer.payment.dto.PaymentResponse;
import io.github.dongyuns.jubjub.domain.customer.payment.dto.PreparePaymentRequest;
import io.github.dongyuns.jubjub.domain.customer.payment.dto.PreparePaymentResponse;
import io.github.dongyuns.jubjub.domain.customer.payment.dto.RefundPaymentRequest;
import io.github.dongyuns.jubjub.domain.customer.payment.dto.RefundResponse;
import io.github.dongyuns.jubjub.domain.shared.external.portone.PortOneClient;
import io.github.dongyuns.jubjub.domain.shared.external.portone.PortOnePaymentDetails;
import io.github.dongyuns.jubjub.domain.shared.external.portone.PortOneRefundCommand;
import io.github.dongyuns.jubjub.domain.shared.external.portone.PortOneRefundResult;
import io.github.dongyuns.jubjub.domain.core.order.repository.OrderRepository;
import io.github.dongyuns.jubjub.domain.core.payment.repository.PaymentCancellationRepository;
import io.github.dongyuns.jubjub.domain.core.payment.repository.PaymentRepository;
import jakarta.persistence.EntityManager;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import lombok.RequiredArgsConstructor;
import jakarta.persistence.OptimisticLockException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final String MERCHANT_UID_PREFIX = "ORDER-";
    private static final DateTimeFormatter MERCHANT_UID_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS");

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentCancellationRepository paymentCancellationRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final MemberCouponRepository memberCouponRepository;
    private final PortOneClient portOneClient;
    private final PickupDistanceService pickupDistanceService;
    private final EntityManager entityManager;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public PreparePaymentResponse preparePayment(String accountEmail, PreparePaymentRequest request) {
        Order order = orderRepository.findById(request.orderId())
                .orElseThrow(() -> new BusinessException("ORDER_NOT_FOUND", "주문을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        validateOrderOwnership(accountEmail, order);

        if (order.getStatus() != OrderStatus.READY) {
            throw new BusinessException("ORDER_NOT_READY", "READY 상태 주문만 결제를 준비할 수 있습니다.", HttpStatus.CONFLICT);
        }

        if (paymentRepository.existsByOrderIdAndStatus(order.getId(), PaymentStatus.PAID)) {
            throw new BusinessException("ORDER_ALREADY_PAID", "이미 결제가 완료된 주문입니다.", HttpStatus.CONFLICT);
        }

        // 각 결제 시도마다 고유 merchantUid를 발급해 PortOne 중복 결제를 방지한다.
        Payment payment = Payment.ready(order, merchantUidOf(order.getId()), request.method());
        return PreparePaymentResponse.from(paymentRepository.save(payment));
    }

    @Transactional(noRollbackFor = BusinessException.class)
    public PaymentResponse confirmPayment(String accountEmail, ConfirmPaymentRequest request) {
        String merchantUid = request.merchantUid();
        validateMerchantUid(merchantUid);
        validateCoordinate(request.userLatitude(), request.userLongitude());

        PortOnePaymentDetails paymentDetails = portOneClient.getPayment(merchantUid);
        Payment payment = paymentRepository.findByMerchantUidForUpdate(merchantUid)
                .orElseThrow(() -> new BusinessException("PAYMENT_NOT_FOUND", "결제 준비 이력이 없습니다.", HttpStatus.NOT_FOUND));
        validateOrderOwnership(accountEmail, payment.getOrder());
        try {
            return confirmPaymentInternal(payment, request.transactionId(), request.userLatitude(), request.userLongitude(), paymentDetails);
        } catch (ObjectOptimisticLockingFailureException | OptimisticLockException exception) {
            return resolveAlreadyConfirmedPayment(merchantUid, request.transactionId());
        }
    }

    @Transactional(noRollbackFor = BusinessException.class)
    public PaymentResponse confirmPaymentByWebhook(String paymentId, String transactionId) {
        PortOnePaymentDetails paymentDetails = portOneClient.getPayment(paymentId);
        Payment payment = paymentRepository.findByMerchantUidForUpdate(paymentId)
                .orElseThrow(() -> new BusinessException("PAYMENT_NOT_FOUND", "결제 준비 이력이 없습니다.", HttpStatus.NOT_FOUND));
        try {
            return confirmPaymentInternal(payment, transactionId, null, null, paymentDetails);
        } catch (ObjectOptimisticLockingFailureException | OptimisticLockException exception) {
            return resolveAlreadyConfirmedPayment(paymentId, transactionId);
        }
    }

    @Transactional
    public void markPaymentFailed(String paymentId, String transactionId) {
        paymentRepository.findByPortonePaymentId(transactionId)
                .or(() -> paymentRepository.findByMerchantUid(paymentId))
                .ifPresent(payment -> payment.markFailed(transactionId));
    }

    @Transactional
    public void markPaymentRefunded(String paymentId, String transactionId) {
        Payment payment = paymentRepository.findByPortonePaymentId(transactionId)
                .or(() -> paymentRepository.findByMerchantUid(paymentId))
                .orElseThrow(() -> new BusinessException("PAYMENT_NOT_FOUND", "결제를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        if (payment.getStatus() == PaymentStatus.REFUNDED) {
            return;
        }

        payment.markRefunded();
        payment.getOrder().markRefunded();
        restoreUsedCoupons(payment.getOrder());
    }

    @Transactional
    public RefundResponse refundPayment(String accountEmail, Long paymentRecordId, RefundPaymentRequest request) {
        Payment payment = paymentRepository.findByIdForUpdate(paymentRecordId)
                .orElseThrow(() -> new BusinessException("PAYMENT_NOT_FOUND", "결제를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        validateOrderOwnership(accountEmail, payment.getOrder());

        if (payment.getStatus() == PaymentStatus.REFUNDED) {
            PaymentCancellation existingRefund = paymentCancellationRepository.findTopByPaymentIdOrderByCreatedAtDesc(paymentRecordId)
                    .orElseThrow(() -> new BusinessException("REFUND_NOT_FOUND", "환불 내역을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
            return RefundResponse.from(existingRefund);
        }

        return refundPaidPayment(payment, request.amount(), request.reason());
    }

    @Transactional
    public RefundResponse refundPaidOrder(Long orderId, String reason) {
        Payment payment = paymentRepository.findByOrderIdAndStatusForUpdate(orderId, PaymentStatus.PAID)
                .orElseThrow(() -> new BusinessException(
                        "PAYMENT_NOT_REFUNDABLE",
                        "환불 가능한 결제 완료 내역을 찾을 수 없습니다.",
                        HttpStatus.CONFLICT
                ));

        return refundPaidPayment(payment, payment.getPaidAmount(), reason);
    }

    private RefundResponse refundPaidPayment(Payment payment, Integer amount, String reason) {
        if (payment.getStatus() != PaymentStatus.PAID) {
            throw new BusinessException("PAYMENT_NOT_REFUNDABLE", "PAID 상태 결제만 환불할 수 있습니다.", HttpStatus.CONFLICT);
        }

        validateRefundAmount(payment.getPaidAmount(), amount);

        // 실제 환불은 PortOne에 먼저 요청하고, 성공 응답을 받은 뒤 내부 상태를 맞춘다.
        PortOneRefundResult refundResult = portOneClient.refund(
                payment.getMerchantUid(),
                new PortOneRefundCommand(amount, reason)
        );

        PaymentCancellation refund = PaymentCancellation.refunded(
                payment,
                refundResult.cancellationId(),
                refundResult.refundAmount(),
                reason,
                refundResult.rawDataJson(),
                LocalDateTime.now(),
                refundResult.refundedAt()
        );

        payment.markRefunded();
        payment.getOrder().markRefunded();
        restoreUsedCoupons(payment.getOrder());

        return RefundResponse.from(paymentCancellationRepository.save(refund));
    }

    private PaymentResponse confirmPaymentInternal(
            Payment payment,
            String transactionId,
            Double userLatitude,
            Double userLongitude,
            PortOnePaymentDetails paymentDetails
    ) {
        Order order = payment.getOrder();

        if (payment.getStatus() == PaymentStatus.PAID && order.getStatus() == OrderStatus.PAID) {
            if (transactionId != null && !transactionId.equals(payment.getPortonePaymentId())) {
                throw new BusinessException("PAYMENT_ALREADY_CONFIRMED", "이미 다른 transactionId로 승인된 결제입니다.", HttpStatus.CONFLICT);
            }
            return PaymentResponse.from(payment);
        }

        if (order.getStatus() != OrderStatus.READY) {
            throw new BusinessException("ORDER_NOT_READY", "READY 상태 주문만 결제를 확정할 수 있습니다.", HttpStatus.CONFLICT);
        }

        if (payment.getStatus() != PaymentStatus.READY) {
            throw new BusinessException("PAYMENT_NOT_READY", "READY 상태 결제만 확정할 수 있습니다.", HttpStatus.CONFLICT);
        }

        if (!paymentDetails.paid()) {
            payment.markFailed(transactionId);
            throw new BusinessException("PORTONE_PAYMENT_NOT_PAID", "PortOne 결제 상태가 paid가 아닙니다.", HttpStatus.CONFLICT);
        }

        if (!order.getFinalAmount().equals(paymentDetails.amount())) {
            payment.markFailed(transactionId);
            throw new BusinessException("PAYMENT_AMOUNT_MISMATCH", "결제 금액 검증에 실패했습니다.", HttpStatus.CONFLICT);
        }

        if (!payment.getMerchantUid().equals(paymentDetails.paymentId())) {
            payment.markFailed(transactionId);
            throw new BusinessException("PAYMENT_ID_MISMATCH", "paymentId 검증에 실패했습니다.", HttpStatus.CONFLICT);
        }

        // PortOne 조회 결과와 내부 주문 정보가 모두 맞을 때만 결제를 확정한다.
        LocalDateTime paidAt = paymentDetails.paidAt() != null ? paymentDetails.paidAt() : LocalDateTime.now();
        String resolvedTransactionId = paymentDetails.transactionId() != null ? paymentDetails.transactionId() : transactionId;
        order.recordUserLocation(userLatitude, userLongitude);
        if (userLatitude != null && userLongitude != null) {
            int pickupDistanceMeters = pickupDistanceService.calculatePickupDistanceMeters(
                    userLatitude,
                    userLongitude,
                    order.getStore()
            );
            order.recordPickupDistanceMeters(pickupDistanceMeters);
        }
        payment.markPaid(resolvedTransactionId, paymentDetails.amount(), paidAt);
        order.markPaid(paidAt);
        markUsedCoupons(order);
        entityManager.flush();

        // 승인 원장 적재는 결제 커밋 이후에 처리해 FK/락 충돌이 결제 확정을 막지 않게 한다.
        eventPublisher.publishEvent(new PaymentApprovedEvent(
                payment.getId(),
                paymentDetails.transactionId(),
                paymentDetails.amount(),
                paymentDetails.rawJson()
        ));

        return PaymentResponse.from(payment);
    }

    private void validateRefundAmount(Integer approvedAmount, Integer refundAmount) {
        if (!approvedAmount.equals(refundAmount)) {
            throw new BusinessException("REFUND_AMOUNT_INVALID", "현재 구현은 전체 환불만 허용합니다.", HttpStatus.CONFLICT);
        }
    }

    private void markUsedCoupons(Order order) {
        List<Long> usedCouponIds = order.getUsedCouponIds();
        if (usedCouponIds == null || usedCouponIds.isEmpty()) {
            return;
        }

        List<MemberCoupon> coupons = memberCouponRepository.findAllByIdInForUpdate(usedCouponIds);
        if (coupons.size() != usedCouponIds.size()) {
            throw new BusinessException("COUPON_NOT_FOUND", "주문에 사용한 쿠폰을 찾을 수 없습니다.", HttpStatus.NOT_FOUND);
        }

        LocalDateTime now = LocalDateTime.now();
        for (MemberCoupon coupon : coupons) {
            if (!coupon.getMemberProfileId().equals(order.getMemberProfileId())) {
                throw new BusinessException("COUPON_FORBIDDEN", "본인의 쿠폰만 사용할 수 있습니다.", HttpStatus.FORBIDDEN);
            }
            if (coupon.getIsUsed()) {
                throw new BusinessException("COUPON_ALREADY_USED", "이미 사용된 쿠폰입니다.", HttpStatus.CONFLICT);
            }
            if (coupon.isExpired() || (coupon.getExpiredAt() != null && coupon.getExpiredAt().isBefore(now))) {
                throw new BusinessException("COUPON_EXPIRED", "유효기간이 만료된 쿠폰입니다.", HttpStatus.CONFLICT);
            }
            coupon.markAsUsed();
        }
    }

    private void restoreUsedCoupons(Order order) {
        List<Long> usedCouponIds = order.getUsedCouponIds();
        if (usedCouponIds == null || usedCouponIds.isEmpty()) {
            return;
        }

        List<MemberCoupon> coupons = memberCouponRepository.findAllByIdInForUpdate(usedCouponIds);
        if (coupons.size() != usedCouponIds.size()) {
            throw new BusinessException("COUPON_NOT_FOUND", "주문에 사용한 쿠폰을 찾을 수 없습니다.", HttpStatus.NOT_FOUND);
        }

        for (MemberCoupon coupon : coupons) {
            if (!coupon.getMemberProfileId().equals(order.getMemberProfileId())) {
                throw new BusinessException("COUPON_FORBIDDEN", "본인의 쿠폰만 복구할 수 있습니다.", HttpStatus.FORBIDDEN);
            }
            coupon.restore();
        }
    }

    private PaymentResponse resolveAlreadyConfirmedPayment(String merchantUid, String transactionId) {
        Payment latestPayment = paymentRepository.findByMerchantUid(merchantUid)
                .orElseThrow(() -> new BusinessException("PAYMENT_NOT_FOUND", "결제 준비 이력이 없습니다.", HttpStatus.NOT_FOUND));
        Order latestOrder = latestPayment.getOrder();

        if (latestPayment.getStatus() == PaymentStatus.PAID && latestOrder.getStatus() == OrderStatus.PAID) {
            if (transactionId != null
                    && latestPayment.getPortonePaymentId() != null
                    && !transactionId.equals(latestPayment.getPortonePaymentId())) {
                throw new BusinessException("PAYMENT_ALREADY_CONFIRMED", "이미 다른 transactionId로 승인된 결제입니다.", HttpStatus.CONFLICT);
            }
            return PaymentResponse.from(latestPayment);
        }

        throw new BusinessException("PAYMENT_CONFIRM_RETRY_REQUIRED", "결제 상태가 확정되지 않았습니다. 다시 시도해 주세요.", HttpStatus.CONFLICT);
    }

    private static String merchantUidOf(Long orderId) {
        return MERCHANT_UID_PREFIX + orderId + "-" + LocalDateTime.now().format(MERCHANT_UID_TIME_FORMAT);
    }

    private void validateOrderOwnership(String accountEmail, Order order) {
        MemberProfile memberProfile = memberProfileRepository.findByAccountEmail(accountEmail)
                .orElseThrow(() -> new BusinessException("MEMBER_PROFILE_NOT_FOUND", "회원 프로필을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        if (!order.getMemberProfileId().equals(memberProfile.getId())) {
            throw new BusinessException("ORDER_FORBIDDEN", "본인 주문/결제 건만 처리할 수 있습니다.", HttpStatus.FORBIDDEN);
        }
    }

    private void validateMerchantUid(String merchantUid) {
        if (merchantUid == null || merchantUid.isBlank()) {
            throw new BusinessException("PAYMENT_ID_REQUIRED", "merchantUid가 필요합니다.", HttpStatus.BAD_REQUEST);
        }
        if (!merchantUid.startsWith(MERCHANT_UID_PREFIX)) {
            throw new BusinessException(
                    "INVALID_MERCHANT_UID",
                    "결제 확인에는 prepare 응답의 merchantUid를 사용해야 합니다.",
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    private void validateCoordinate(double latitude, double longitude) {
        if (latitude < -90 || latitude > 90) {
            throw new BusinessException("INVALID_LATITUDE", "위도 값이 올바르지 않습니다.", HttpStatus.BAD_REQUEST);
        }
        if (longitude < -180 || longitude > 180) {
            throw new BusinessException("INVALID_LONGITUDE", "경도 값이 올바르지 않습니다.", HttpStatus.BAD_REQUEST);
        }
    }
}
