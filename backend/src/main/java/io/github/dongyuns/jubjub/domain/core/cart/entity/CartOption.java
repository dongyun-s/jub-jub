package io.github.dongyuns.jubjub.domain.core.cart.entity;

import io.github.dongyuns.jubjub.domain.core.menu.entity.MenuOption; // 🌟 맞게 찾아주신 MenuOption!
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cart_options")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CartOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cart_option_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    // 🌟 이 부분이 OptionDetail에서 MenuOption으로 변경되었습니다!
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_option_id", nullable = false)
    private MenuOption menuOption;

    // 연관관계 편의 메서드
    public void assignCart(Cart cart) {
        this.cart = cart;
    }
}