package io.github.dongyuns.jubjub.domain.cart.entity;

import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile; // 패키지 경로 확인!
import io.github.dongyuns.jubjub.domain.store.entity.Store;
import io.github.dongyuns.jubjub.domain.store.entity.Menu;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "장바구니")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "장바구니번호")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "고객프로필번호", nullable = false)
    private MemberProfile memberProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "매장번호", nullable = false)
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "메뉴번호", nullable = false)
    private Menu menu;

    @Column(name = "수량", nullable = false)
    private Integer quantity;

    // 🌟 우리가 추가한 메뉴별 요청사항!
    @Column(name = "요청사항", length = 500)
    private String requestMemo;

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CartOption> cartOptions = new ArrayList<>();

    // 수량 변경 비즈니스 메서드
    public void updateQuantity(int quantity) {
        this.quantity = quantity;
    }
}