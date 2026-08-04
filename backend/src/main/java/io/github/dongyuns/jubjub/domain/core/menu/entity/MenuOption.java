package io.github.dongyuns.jubjub.domain.core.menu.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "menu_option")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MenuOption {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 🌟 다대일(N:1) 관계: 여러 개의 옵션이 하나의 메뉴에 속함
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_id", nullable = false)
    private Menu menu;

    @Column(nullable = false)
    private String name; // 옵션명 (예: 치즈 추가)

    private int additionalPrice = 0; // 추가 금액

    private boolean isRequired = false; // 필수 선택 여부

    @Builder
    public MenuOption(Menu menu, String name, int additionalPrice, boolean isRequired) {
        this.menu = menu;
        this.name = name;
        this.additionalPrice = additionalPrice;
        this.isRequired = isRequired;
    }
}