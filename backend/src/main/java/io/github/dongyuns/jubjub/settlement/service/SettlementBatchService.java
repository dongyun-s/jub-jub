package io.github.dongyuns.jubjub.settlement.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.payment.domain.PaymentCancellation;
import io.github.dongyuns.jubjub.payment.domain.PaymentTransaction;
import io.github.dongyuns.jubjub.payment.repository.PaymentCancellationRepository;
import io.github.dongyuns.jubjub.payment.repository.PaymentTransactionRepository;
import io.github.dongyuns.jubjub.settlement.domain.Settlement;
import io.github.dongyuns.jubjub.settlement.domain.SettlementAccount;
import io.github.dongyuns.jubjub.settlement.domain.SettlementItem;
import io.github.dongyuns.jubjub.settlement.domain.SettlementSourceType;
import io.github.dongyuns.jubjub.settlement.dto.RunSettlementBatchRequest;
import io.github.dongyuns.jubjub.settlement.dto.RunSettlementBatchResponse;
import io.github.dongyuns.jubjub.settlement.dto.SettlementItemResponse;
import io.github.dongyuns.jubjub.settlement.dto.SettlementResponse;
import io.github.dongyuns.jubjub.settlement.repository.SettlementAccountRepository;
import io.github.dongyuns.jubjub.settlement.repository.SettlementItemRepository;
import io.github.dongyuns.jubjub.settlement.repository.SettlementRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SettlementBatchService {

    private static final int PLATFORM_FEE_RATE_PERCENT = 5;
    private static final int PG_FEE_RATE_PERCENT = 3;

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PaymentCancellationRepository paymentCancellationRepository;
    private final SettlementAccountRepository settlementAccountRepository;
    private final SettlementRepository settlementRepository;
    private final SettlementItemRepository settlementItemRepository;

    @Transactional
    public RunSettlementBatchResponse run(RunSettlementBatchRequest request) {
        // 정산 기간에 포함되는 승인/환불 원장을 먼저 조회해 매장별로 묶는다.
        validatePeriod(request.periodStart(), request.periodEnd());

        LocalDateTime startAt = request.periodStart().atStartOfDay();
        LocalDateTime endAt = request.periodEnd().plusDays(1).atStartOfDay();

        List<PaymentTransaction> transactions = paymentTransactionRepository.findAllForSettlementBetween(startAt, endAt);
        List<PaymentCancellation> cancellations = paymentCancellationRepository.findAllForSettlementBetween(startAt, endAt);

        Map<Long, StoreSettlementAccumulator> accumulators = new LinkedHashMap<>();
        transactions.stream()
                .filter(transaction -> isTargetStore(request.storeId(), transaction.getPayment().getOrder().getStoreId()))
                .forEach(transaction -> accumulators
                        .computeIfAbsent(transaction.getPayment().getOrder().getStoreId(), StoreSettlementAccumulator::new)
                        .addTransaction(transaction));

        cancellations.stream()
                .filter(cancellation -> isTargetStore(request.storeId(), cancellation.getPayment().getOrder().getStoreId()))
                .forEach(cancellation -> accumulators
                        .computeIfAbsent(cancellation.getPayment().getOrder().getStoreId(), StoreSettlementAccumulator::new)
                        .addCancellation(cancellation));

        List<SettlementResponse> settlements = accumulators.values().stream()
                .sorted(Comparator.comparing(StoreSettlementAccumulator::storeId))
                .map(accumulator -> createOrLoadSettlement(accumulator, request.periodStart(), request.periodEnd()))
                .toList();

        return new RunSettlementBatchResponse(
                request.periodStart(),
                request.periodEnd(),
                settlements.size(),
                settlements
        );
    }

    private SettlementResponse createOrLoadSettlement(
            StoreSettlementAccumulator accumulator,
            LocalDate periodStart,
            LocalDate periodEnd
    ) {
        // 같은 매장/기간 정산서는 한 번만 만들고, 원장 항목만 추가 적재한다.
        Settlement settlement = settlementRepository.findByStoreIdAndPeriodStartAndPeriodEnd(accumulator.storeId(), periodStart, periodEnd)
                .orElseGet(() -> createSettlement(accumulator, periodStart, periodEnd));

        List<SettlementItemResponse> itemResponses = new ArrayList<>();

        for (PaymentTransaction transaction : accumulator.transactions()) {
            if (!settlementItemRepository.existsBySourceTypeAndSourceId(SettlementSourceType.PAYMENT_TRANSACTION, transaction.getId())) {
                settlementItemRepository.save(SettlementItem.payment(
                        settlement,
                        transaction.getPayment().getOrder().getId(),
                        transaction.getPayment().getId(),
                        transaction.getAmount(),
                        transaction.getId()
                ));
            }
        }

        for (PaymentCancellation cancellation : accumulator.cancellations()) {
            if (!settlementItemRepository.existsBySourceTypeAndSourceId(SettlementSourceType.PAYMENT_CANCELLATION, cancellation.getId())) {
                settlementItemRepository.save(SettlementItem.refund(
                        settlement,
                        cancellation.getPayment().getOrder().getId(),
                        cancellation.getPayment().getId(),
                        cancellation.getAmount(),
                        cancellation.getId()
                ));
            }
        }

        settlementItemRepository.findAllBySettlementId(settlement.getId())
                .stream()
                .map(SettlementItemResponse::from)
                .forEach(itemResponses::add);

        return SettlementResponse.of(settlement, itemResponses);
    }

    private Settlement createSettlement(StoreSettlementAccumulator accumulator, LocalDate periodStart, LocalDate periodEnd) {
        SettlementAccount settlementAccount = settlementAccountRepository.findByStoreIdAndActiveTrue(accumulator.storeId())
                .orElseThrow(() -> new BusinessException(
                        "SETTLEMENT_ACCOUNT_NOT_FOUND",
                        "활성 정산계좌가 없어 정산을 생성할 수 없습니다. storeId=" + accumulator.storeId(),
                        HttpStatus.CONFLICT
                ));

        int grossAmount = accumulator.grossAmount();
        int refundAmount = accumulator.refundAmount();
        int platformFeeAmount = percentage(grossAmount, PLATFORM_FEE_RATE_PERCENT);
        int pgFeeAmount = percentage(grossAmount, PG_FEE_RATE_PERCENT);
        int netPayoutAmount = grossAmount - refundAmount - platformFeeAmount - pgFeeAmount;

        // 실제 송금 전이라도 정산 예상 금액을 먼저 만들어 추후 지급 처리의 기준으로 사용한다.
        Settlement settlement = Settlement.create(
                accumulator.storeId(),
                settlementAccount,
                periodStart,
                periodEnd,
                grossAmount,
                refundAmount,
                platformFeeAmount,
                pgFeeAmount,
                netPayoutAmount,
                periodEnd.plusDays(1).atStartOfDay()
        );

        return settlementRepository.save(settlement);
    }

    private void validatePeriod(LocalDate periodStart, LocalDate periodEnd) {
        if (periodStart.isAfter(periodEnd)) {
            throw new BusinessException("INVALID_SETTLEMENT_PERIOD", "정산 시작일은 종료일보다 늦을 수 없습니다.", HttpStatus.BAD_REQUEST);
        }
    }

    private boolean isTargetStore(Long requestedStoreId, Long storeId) {
        return requestedStoreId == null || requestedStoreId.equals(storeId);
    }

    private int percentage(int amount, int rate) {
        return Math.floorDiv(amount * rate, 100);
    }

    private record StoreSettlementAccumulator(
            Long storeId,
            List<PaymentTransaction> transactions,
            List<PaymentCancellation> cancellations
    ) {
        private StoreSettlementAccumulator(Long storeId) {
            this(storeId, new ArrayList<>(), new ArrayList<>());
        }

        private void addTransaction(PaymentTransaction transaction) {
            transactions.add(transaction);
        }

        private void addCancellation(PaymentCancellation cancellation) {
            cancellations.add(cancellation);
        }

        private int grossAmount() {
            return transactions.stream().mapToInt(PaymentTransaction::getAmount).sum();
        }

        private int refundAmount() {
            return cancellations.stream().mapToInt(PaymentCancellation::getAmount).sum();
        }
    }
}
