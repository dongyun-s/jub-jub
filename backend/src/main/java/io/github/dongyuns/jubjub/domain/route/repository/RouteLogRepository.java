package io.github.dongyuns.jubjub.domain.route.repository;

import io.github.dongyuns.jubjub.domain.route.entity.RouteLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RouteLogRepository extends JpaRepository<RouteLog, Long> {
}
