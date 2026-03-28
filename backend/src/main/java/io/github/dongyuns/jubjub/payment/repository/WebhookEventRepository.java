package io.github.dongyuns.jubjub.payment.repository;

import io.github.dongyuns.jubjub.payment.domain.WebhookEvent;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WebhookEventRepository extends JpaRepository<WebhookEvent, Long> {

    Optional<WebhookEvent> findByDedupeKey(String dedupeKey);
}
