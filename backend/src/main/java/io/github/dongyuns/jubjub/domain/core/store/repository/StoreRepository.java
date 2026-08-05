package io.github.dongyuns.jubjub.domain.core.store.repository;

import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StoreRepository extends JpaRepository<Store, Long> {

    /**
     * 사장님(MemberProfile)의 매장 조회
     */
    Optional<Store> findByOwnerProfileId(Long ownerProfileId);

    /**
     * 해당 사장님의 매장 존재 여부
     */
    boolean existsByOwnerProfileId(Long ownerProfileId);

    /**
     * 카테고리별 매장 조회
     */
    List<Store> findByCategoryIdOrderByIdAsc(Integer categoryId);

    /**
     * 지도 범위 내 매장 조회
     */
    List<Store> findByLatitudeBetweenAndLongitudeBetween(
            Double minLatitude,
            Double maxLatitude,
            Double minLongitude,
            Double maxLongitude
    );

    /**
     * 카테고리 + 지도 범위 내 매장 조회
     */
    List<Store> findByCategoryIdAndLatitudeBetweenAndLongitudeBetween(
            Integer categoryId,
            Double minLatitude,
            Double maxLatitude,
            Double minLongitude,
            Double maxLongitude
    );
}