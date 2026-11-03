package io.github.dongyuns.jubjub.domain.core.favorite.entity;

import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.core.member.entity.MemberProfile;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "store_favorite", uniqueConstraints = {
        // 🌟 핵심 포인트: 한 유저가 같은 매장을 여러 번 찜하는 것을 DB 단에서 원천 차단!
        @UniqueConstraint(
                name = "uk_store_favorite_member_store",
                columnNames = {"member_profile_id", "store_id"}
        )
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class StoreFavorite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "favorite_id")
    private Long id;

    // 누가 찜했는가? (회원 프로필과 연결)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_profile_id", nullable = false)
    private MemberProfile memberProfile;

    // 어떤 매장을 찜했는가? (매장과 연결)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    // 언제 찜했는가? (자동 생성)
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public StoreFavorite(MemberProfile memberProfile, Store store) {
        this.memberProfile = memberProfile;
        this.store = store;
    }
}