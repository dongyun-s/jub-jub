package io.github.dongyuns.jubjub.domain.core.ordertracking.service;

import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTracking;
import io.github.dongyuns.jubjub.domain.core.payment.event.PaymentApprovedEvent;
import io.github.dongyuns.jubjub.domain.core.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class OrderTrackingPaymentEventListener {

    private final PaymentRepository paymentRepository;
    private final OrderTrackingLifecycleService orderTrackingLifecycleService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handlePaymentApproved(PaymentApprovedEvent event) {
        paymentRepository.findById(event.paymentId()).ifPresent(payment -> {
            OrderTracking tracking = orderTrackingLifecycleService.ensureTracking(payment.getOrder());
            if (tracking != null) {
                orderTrackingLifecycleService.notifyStatusChange(payment.getOrder(), tracking);
            }
        });
    }
}
