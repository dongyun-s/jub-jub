package io.github.dongyuns.jubjub.domain.cart.repository;

import io.github.dongyuns.jubjub.domain.cart.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {

    // 특정 회원의 장바구니 목록을 매장 기준으로 조회할 때 사용할 메서드
    List<Cart> findAllByMemberProfileIdAndStoreId(Long memberProfileId, Long storeId);

    // 특정 회원의 장바구니 전체 조회
    List<Cart> findAllByMemberProfileId(Long memberProfileId);

    java.util.Optional<Cart> findByIdAndMemberProfileId(Long cartId, Long memberProfileId);
}
