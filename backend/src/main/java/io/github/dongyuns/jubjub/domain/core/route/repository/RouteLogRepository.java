package io.github.dongyuns.jubjub.domain.core.route.repository;

import io.github.dongyuns.jubjub.domain.core.route.entity.RouteLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RouteLogRepository extends JpaRepository<RouteLog, Long> {
}
