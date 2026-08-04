package io.github.dongyuns.jubjub.domain.core.menu.repository;

import io.github.dongyuns.jubjub.domain.core.menu.entity.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MenuRepository extends JpaRepository<Menu, Long> {
    // 특정 매장의 메뉴 목록만 쏙 뽑아오는 메서드
    List<Menu> findByStoreId(Long storeId);
}