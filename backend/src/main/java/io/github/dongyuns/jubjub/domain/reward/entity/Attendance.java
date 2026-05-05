package io.github.dongyuns.jubjub.domain.reward.entity;

import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import io.github.dongyuns.jubjub.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(
        name = "출석_체크_내역",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_attendance_profile_date", columnNames = {"고객프로필번호", "출석일자"})
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
// @EntityListeners 대신 우리가 만든 공통 엔티티(BaseTimeEntity)를 상속받습니다.
public class Attendance extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "출석번호")
    private Long id;

    // ID(Long) 대신 MemberProfile 객체와 직접 관계를 맺습니다.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "고객프로필번호", nullable = false)
    private MemberProfile memberProfile;

    @Column(name = "출석일자", nullable = false)
    private LocalDate attendanceDate;

    // BaseTimeEntity를 상속받으므로 createdAt 필드는 삭제해도 자동으로 생성됩니다.

    @Builder
    public Attendance(MemberProfile memberProfile, LocalDate attendanceDate) {
        this.memberProfile = memberProfile;
        this.attendanceDate = attendanceDate;
    }
}