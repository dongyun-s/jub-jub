package io.github.dongyuns.jubjub.domain.user.entity;

import io.github.dongyuns.jubjub.domain.auth.entity.Account;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "member_profile")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemberProfile {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 계정(Account)과 1:1 관계 설정
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", unique = true, nullable = false)
    private Account account;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String phone;

    private String nickname;

    private int pointBalance = 0;         // 포인트 잔액
    private int totalWalkingDistance = 0; // 누적 도보 거리
    private int orderCount = 0;           // 누적 주문 횟수
    private boolean pushAgree = true;     // 푸시 알림 동의 여부

    @Builder
    public MemberProfile(Account account, String name, String phone, String nickname, int pointBalance) {
        this.account = account;
        this.name = name;
        this.phone = phone;
        this.nickname = nickname;
        this.pointBalance = pointBalance;
    }
}
