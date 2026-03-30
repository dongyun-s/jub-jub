package io.github.dongyuns.jubjub.domain.favorite.repository;

import io.github.dongyuns.jubjub.domain.favorite.entity.StoreFavorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;
import java.util.Optional;

public interface StoreFavoriteRepository extends JpaRepository<StoreFavorite, Long> {

    // 1. 찜 토글용: 이 유저가 이 매장을 찜했는지 검사
    Optional<StoreFavorite> findByMemberProfileIdAndStoreId(Long memberProfileId, Long storeId);

    // 2. 내 찜 목록 조회용: 매장(Store) 정보까지 한 번에 묶어서 가져오기 (N+1 성능 문제 방지!)
    @EntityGraph(attributePaths = {"store"})
    List<StoreFavorite> findAllByMemberProfileId(Long memberProfileId);
}