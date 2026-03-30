package io.github.dongyuns.jubjub.payment.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.user.repository.MemberProfileRepository;
import io.github.dongyuns.jubjub.payment.domain.Order;
import io.github.dongyuns.jubjub.payment.domain.OrderStatus;
import io.github.dongyuns.jubjub.payment.domain.Payment;
import io.github.dongyuns.jubjub.payment.domain.PaymentCancellation;
import io.github.dongyuns.jubjub.payment.domain.PaymentStatus;
import io.github.dongyuns.jubjub.payment.domain.PaymentTransaction;
import io.github.dongyuns.jubjub.payment.dto.ConfirmPaymentRequest;
import io.github.dongyuns.jubjub.payment.dto.PaymentResponse;
import io.github.dongyuns.jubjub.payment.dto.PreparePaymentRequest;
import io.github.dongyuns.jubjub.payment.dto.PreparePaymentResponse;
import io.github.dongyuns.jubjub.payment.dto.RefundPaymentRequest;
import io.github.dongyuns.jubjub.payment.dto.RefundResponse;
import io.github.dongyuns.jubjub.payment.portone.PortOneClient;
import io.github.dongyuns.jubjub.payment.portone.PortOnePaymentDetails;
import io.github.dongyuns.jubjub.payment.portone.PortOneRefundCommand;
import io.github.dongyuns.jubjub.payment.portone.PortOneRefundResult;
import io.github.dongyuns.jubjub.payment.repository.OrderRepository;
import io.github.dongyuns.jubjub.payment.repository.PaymentCancellationRepository;
import io.github.dongyuns.jubjub.payment.repository.PaymentRepository;
import io.github.dongyuns.jubjub.payment.repository.PaymentTransactionRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final String MERCHANT_UID_PREFIX = "ORDER-";

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentCancellationRepository paymentCancellationRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final PortOneClient portOneClient;

    @Transactional
    public PreparePaymentResponse preparePayment(String accountEmail, PreparePaymentRequest request) {
        Order order = orderRepository.findById(request.orderId())
                .orElseThrow(() -> new BusinessException("ORDER_NOT_FOUND", "주문을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        validateOrderOwnership(accountEmail, order);

        if (order.getStatus() != OrderStatus.READY) {
            throw new BusinessException("ORDER_NOT_READY", "READY 상태 주문만 결제를 준비할 수 있습니다.", HttpStatus.CONFLICT);
        }

        Optional<Payment> existingPayment = paymentRepository.findByOrderId(order.getId());
        if (existingPayment.isPresent()) {
            return PreparePaymentResponse.from(existingPayment.get());
        }

        // paymentId는 PortOne V2에서 다시 조회할 식별자라 주문 단위로 고정한다.
        Payment payment = Payment.ready(order, merchantUidOf(order.getId()), request.method());

        try {
            return PreparePaymentResponse.from(paymentRepository.save(payment));
        } catch (DataIntegrityViolationException exception) {
            // 동시에 같은 주문을 준비해도 기존 결제 건을 재사용하도록 처리한다.
            Payment duplicated = paymentRepository.findByOrderId(order.getId())
                    .orElseThrow(() -> exception);
            return PreparePaymentResponse.from(duplicated);
        }
    }

    @Transactional(noRollbackFor = BusinessException.class)
    public PaymentResponse confirmPayment(String accountEmail, ConfirmPaymentRequest request) {
        String merchantUid = request.resolvedMerchantUid();
        validateMerchantUid(merchantUid);

        Payment payment = paymentRepository.findByMerchantUid(merchantUid)
                .orElseThrow(() -> new BusinessException("PAYMENT_NOT_FOUND", "결제 준비 이력이 없습니다.", HttpStatus.NOT_FOUND));
        validateOrderOwnership(accountEmail, payment.getOrder());
        PortOnePaymentDetails paymentDetails = portOneClient.getPayment(merchantUid);
        return confirmPaymentInternal(payment.getOrder().getId(), request.transactionId(), paymentDetails);
    }

    @Transactional(noRollbackFor = BusinessException.class)
    public PaymentResponse confirmPaymentByWebhook(String paymentId, String transactionId) {
        PortOnePaymentDetails paymentDetails = portOneClient.getPayment(paymentId);
        Long orderId = parseOrderId(paymentDetails.paymentId());
        return confirmPaymentInternal(orderId, transactionId, paymentDetails);
    }

    @Transactional
    public void markPaymentFailed(String paymentId, String transactionId) {
        paymentRepository.findByPortonePaymentId(transactionId)
                .or(() -> paymentRepository.findByMerchantUid(paymentId))
                .ifPresent(payment -> {
                    payment.markFailed(transactionId);
                    payment.getOrder().markFailed();
                });
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
    }

    @Transactional
    public RefundResponse refundPayment(String accountEmail, Long paymentId, RefundPaymentRequest request) {
        Payment payment = paymentRepository.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new BusinessException("PAYMENT_NOT_FOUND", "결제를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        validateOrderOwnership(accountEmail, payment.getOrder());

        if (payment.getStatus() == PaymentStatus.REFUNDED) {
            PaymentCancellation existingRefund = paymentCancellationRepository.findTopByPaymentIdOrderByCreatedAtDesc(paymentId)
                    .orElseThrow(() -> new BusinessException("REFUND_NOT_FOUND", "환불 내역을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
            return RefundResponse.from(existingRefund);
        }

        if (payment.getStatus() != PaymentStatus.PAID) {
            throw new BusinessException("PAYMENT_NOT_REFUNDABLE", "PAID 상태 결제만 환불할 수 있습니다.", HttpStatus.CONFLICT);
        }

        validateRefundAmount(payment.getPaidAmount(), request.amount());

        // 실제 환불은 PortOne에 먼저 요청하고, 성공 응답을 받은 뒤 내부 상태를 맞춘다.
        PortOneRefundResult refundResult = portOneClient.refund(
                payment.getMerchantUid(),
                new PortOneRefundCommand(request.amount(), request.reason())
        );

        PaymentCancellation refund = PaymentCancellation.refunded(
                payment,
                refundResult.cancellationId(),
                refundResult.refundAmount(),
                request.reason(),
                refundResult.rawDataJson(),
                LocalDateTime.now(),
                refundResult.refundedAt()
        );

        payment.markRefunded();
        payment.getOrder().markRefunded();

        return RefundResponse.from(paymentCancellationRepository.save(refund));
    }

    private PaymentResponse confirmPaymentInternal(Long orderId, String transactionId, PortOnePaymentDetails paymentDetails) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("ORDER_NOT_FOUND", "주문을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseThrow(() -> new BusinessException("PAYMENT_NOT_FOUND", "결제 준비 이력이 없습니다.", HttpStatus.NOT_FOUND));

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
        payment.markPaid(resolvedTransactionId, paymentDetails.amount(), paidAt);
        order.markPaid(paidAt);

        // 같은 transactionId는 한 번만 남겨 정산/추적 시 중복 적재를 막는다.
        if (paymentDetails.transactionId() != null && !paymentDetails.transactionId().isBlank()) {
            paymentTransactionRepository.findByPortoneTransactionId(paymentDetails.transactionId())
                    .orElseGet(() -> paymentTransactionRepository.save(
                            PaymentTransaction.approved(
                                    payment,
                                    paymentDetails.transactionId(),
                                    PaymentStatus.PAID.name(),
                                    paymentDetails.amount(),
                                    paymentDetails.rawJson()
                            )
                    ));
        }

        return PaymentResponse.from(payment);
    }

    private void validateRefundAmount(Integer approvedAmount, Integer refundAmount) {
        if (!approvedAmount.equals(refundAmount)) {
            throw new BusinessException("REFUND_AMOUNT_INVALID", "현재 구현은 전체 환불만 허용합니다.", HttpStatus.CONFLICT);
        }
    }

    private static String merchantUidOf(Long orderId) {
        return MERCHANT_UID_PREFIX + orderId;
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
                    "결제 확인에는 prepare 응답의 merchantUid(예: ORDER-2)를 사용해야 합니다.",
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    private Long parseOrderId(String paymentId) {
        if (paymentId == null || !paymentId.startsWith(MERCHANT_UID_PREFIX)) {
            throw new BusinessException("INVALID_PAYMENT_ID", "paymentId에서 주문번호를 추출할 수 없습니다.", HttpStatus.BAD_REQUEST);
        }

        try {
            return Long.parseLong(paymentId.substring(MERCHANT_UID_PREFIX.length()));
        } catch (NumberFormatException exception) {
            throw new BusinessException("INVALID_PAYMENT_ID", "paymentId 형식이 올바르지 않습니다.", HttpStatus.BAD_REQUEST);
        }
    }
}
