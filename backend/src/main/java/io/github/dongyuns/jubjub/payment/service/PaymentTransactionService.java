package io.github.dongyuns.jubjub.payment.service;

import io.github.dongyuns.jubjub.payment.domain.Payment;
import io.github.dongyuns.jubjub.payment.domain.PaymentStatus;
import io.github.dongyuns.jubjub.payment.domain.PaymentTransaction;
import io.github.dongyuns.jubjub.payment.repository.PaymentRepository;
import io.github.dongyuns.jubjub.payment.repository.PaymentTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentTransactionService {

    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveApprovedIfAbsent(Long paymentId, String transactionId, Integer amount, String rawJson) {
        if (transactionId == null || transactionId.isBlank()) {
            return;
        }

        Payment payment = paymentRepository.findById(paymentId).orElse(null);
        if (payment == null) {
            return;
        }

        try {
            paymentTransactionRepository.findByPortoneTransactionId(transactionId)
                    .orElseGet(() -> paymentTransactionRepository.saveAndFlush(
                            PaymentTransaction.approved(
                                    payment,
                                    transactionId,
                                    PaymentStatus.PAID.name(),
                                    amount,
                                    rawJson
                            )
                    ));
        } catch (DataIntegrityViolationException ignored) {
            // confirm/webhook 동시 처리로 같은 transactionId가 먼저 저장된 경우 무시한다.
        }
    }
}
