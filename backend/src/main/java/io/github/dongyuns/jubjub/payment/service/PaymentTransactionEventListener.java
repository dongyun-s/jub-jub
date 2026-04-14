package io.github.dongyuns.jubjub.payment.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class PaymentTransactionEventListener {

    private final PaymentTransactionService paymentTransactionService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handlePaymentApproved(PaymentApprovedEvent event) {
        paymentTransactionService.saveApprovedIfAbsent(
                event.paymentId(),
                event.transactionId(),
                event.amount(),
                event.rawJson()
        );
    }
}
