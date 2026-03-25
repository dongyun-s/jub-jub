package io.github.dongyuns.jubjub.user.domain;

import io.github.dongyuns.jubjub.payment.domain.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "customer_profiles")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CustomerProfile extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(length = 100)
    private String nickname;

    private Integer gradeId;

    @Column(nullable = false)
    private Integer totalWalkM;

    @Column(nullable = false)
    private Integer pointBalance;

    @Builder
    private CustomerProfile(Account account, String nickname, Integer gradeId, Integer totalWalkM, Integer pointBalance) {
        this.account = account;
        this.nickname = nickname;
        this.gradeId = gradeId;
        this.totalWalkM = totalWalkM;
        this.pointBalance = pointBalance;
    }
}
