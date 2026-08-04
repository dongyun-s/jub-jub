package io.github.dongyuns.jubjub.domain.core.reward.entity;

import io.github.dongyuns.jubjub.domain.core.member.entity.MemberProfile;
import io.github.dongyuns.jubjub.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(
        name = "attendance",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_attendance_profile_date", columnNames = {"member_profile_id", "attendance_date"})
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
// @EntityListeners 대신 우리가 만든 공통 엔티티(BaseTimeEntity)를 상속받습니다.
public class Attendance extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ID(Long) 대신 MemberProfile 객체와 직접 관계를 맺습니다.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_profile_id", nullable = false)
    private MemberProfile memberProfile;

    @Column(nullable = false)
    private LocalDate attendanceDate;

    // 랜덤박스 오픈 여부 (기본값 false)
    @Column(nullable = false)
    private boolean isRandomBoxOpened = false;

    @Builder
    public Attendance(MemberProfile memberProfile, LocalDate attendanceDate) {
        this.memberProfile = memberProfile;
        this.attendanceDate = attendanceDate;
    }

    // 랜덤박스 오픈 시 상태를 true로 변경하는 메서드
    public void markAsOpened() {
        this.isRandomBoxOpened = true;
    }
}