package io.github.dongyuns.jubjub.domain.cart.entity;

import io.github.dongyuns.jubjub.domain.store.entity.MenuOption; // 🌟 맞게 찾아주신 MenuOption!
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "장바구니_옵션")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CartOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "장바구니옵션번호")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "장바구니번호", nullable = false)
    private Cart cart;

    // 🌟 이 부분이 OptionDetail에서 MenuOption으로 변경되었습니다!
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "옵션상세번호", nullable = false)
    private MenuOption menuOption;

    // 연관관계 편의 메서드
    public void assignCart(Cart cart) {
        this.cart = cart;
    }
}