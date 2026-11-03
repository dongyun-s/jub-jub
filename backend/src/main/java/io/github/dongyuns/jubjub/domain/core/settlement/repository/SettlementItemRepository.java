package io.github.dongyuns.jubjub.domain.core.settlement.repository;

import io.github.dongyuns.jubjub.domain.core.settlement.entity.SettlementItem;
import io.github.dongyuns.jubjub.domain.core.settlement.entity.SettlementSourceType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SettlementItemRepository extends JpaRepository<SettlementItem, Long> {

    boolean existsBySourceTypeAndSourceId(SettlementSourceType sourceType, Long sourceId);

    List<SettlementItem> findAllBySettlementId(Long settlementId);
}
