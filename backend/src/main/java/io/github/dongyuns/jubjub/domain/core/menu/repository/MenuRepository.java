package io.github.dongyuns.jubjub.domain.core.menu.repository;

import io.github.dongyuns.jubjub.domain.core.menu.entity.Menu;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MenuRepository extends JpaRepository<Menu, Long> {

    /**
     * 삭제되지 않은 메뉴 목록 조회
     */
    List<Menu> findByStoreIdAndIsDeletedFalse(Long storeId);

    /**
     * 현재 로그인한 사장님의 메뉴 조회
     * (수정 / 삭제 / 품절 처리 시 사용)
     */
    Optional<Menu> findByIdAndStoreIdAndIsDeletedFalse(
            Long menuId,
            Long storeId
    );
}