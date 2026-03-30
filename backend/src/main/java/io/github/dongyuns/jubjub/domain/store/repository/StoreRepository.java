package io.github.dongyuns.jubjub.domain.store.repository;

import io.github.dongyuns.jubjub.domain.store.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreRepository extends JpaRepository<Store, Long> {
    // 카테고리별 매장 조회를 위한 메서드 (나중에 쓸 예정!)
    // List<Store> findByCategory(String category);
}