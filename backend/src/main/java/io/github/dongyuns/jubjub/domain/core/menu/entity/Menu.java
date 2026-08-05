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

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 여러 개의 메뉴가 하나의 매장에 속함
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @Column(nullable = false)
    private String name; // 메뉴명

    @Column(nullable = false)
    private int price; // 가격

    @Column(columnDefinition = "TEXT")
    private String description; // 메뉴 설명

    /**
     * 메뉴 카테고리
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MenuCategory category;

    /**
     * 매운 메뉴 여부
     */
    @Column(nullable = false)
    private boolean isSpicy = false;

    /**
     * 채식 메뉴 여부
     */
    @Column(nullable = false)
    private boolean isVegetarian = false;

    /**
     * 베스트 메뉴 여부
     */
    @Column(nullable = false)
    private boolean isBest = false;

    /**
     * 품절 여부
     */
    @Column(nullable = false)
    private boolean isSoldOut = false;

    /**
     * 메뉴 주문 시 획득 경험치
     */
    @Column(nullable = false)
    private int rewardXp = 0;

    /**
     * Soft Delete 여부
     */
    @Column(nullable = false)
    private boolean isDeleted = false;

    @OneToMany(mappedBy = "menu", fetch = FetchType.LAZY)
    private java.util.List<MenuOption> options = new java.util.ArrayList<>();

    @Builder
    public Menu(
            Store store,
            String name,
            int price,
            String description,
            MenuCategory category,
            boolean isSpicy,
            boolean isVegetarian,
            boolean isBest,
            boolean isSoldOut,
            int rewardXp
    ) {
        this.store = store;
        this.name = name;
        this.price = price;
        this.description = description;
        this.category = category;
        this.isSpicy = isSpicy;
        this.isVegetarian = isVegetarian;
        this.isBest = isBest;
        this.isSoldOut = isSoldOut;
        this.rewardXp = rewardXp;
    }

    /**
     * 메뉴 정보 수정
     */
    public void updateMenu(
            String name,
            String description,
            int price,
            MenuCategory category,
            boolean isSpicy,
            boolean isVegetarian,
            boolean isBest
    ) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.category = category;
        this.isSpicy = isSpicy;
        this.isVegetarian = isVegetarian;
        this.isBest = isBest;
    }

    /**
     * 품절 여부 변경
     */
    public void updateSoldOut(boolean soldOut) {
        this.isSoldOut = soldOut;
    }

    /**
     * 경험치 변경
     */
    public void updateRewardXp(int rewardXp) {
        this.rewardXp = rewardXp;
    }

    /**
     * 메뉴 삭제 (Soft Delete)
     */
    public void delete() {
        this.isDeleted = true;
    }

    /**
     * 삭제된 메뉴 복구
     */
    public void restore() {
        this.isDeleted = false;
    }
}