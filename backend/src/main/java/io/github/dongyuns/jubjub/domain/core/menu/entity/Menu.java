package io.github.dongyuns.jubjub.domain.core.menu.entity;

import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "menu")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Menu {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 🌟 다대일(N:1) 관계: 여러 개의 메뉴가 하나의 매장에 속함
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @Column(nullable = false)
    private String name; // 메뉴명

    @Column(nullable = false)
    private int price; // 가격

    @Column(columnDefinition = "TEXT")
    private String description; // 메뉴 설명

    private boolean isSoldOut = false; // 품절 여부

    // 🌟 UI 프로토타입을 반영하여 추가한 필드!
    private int rewardXp = 0; // 메뉴 주문 시 획득 가능한 경험치

    // 메뉴가 자신의 옵션들을 리스트로 꽉 쥐고 있게
    @OneToMany(mappedBy = "menu", fetch = FetchType.LAZY)
    private java.util.List<MenuOption> options = new java.util.ArrayList<>();

    @Builder
    public Menu(Store store, String name, int price, String description, boolean isSoldOut, int rewardXp) {
        this.store = store;
        this.name = name;
        this.price = price;
        this.description = description;
        this.isSoldOut = isSoldOut;
        this.rewardXp = rewardXp;
    }
}
