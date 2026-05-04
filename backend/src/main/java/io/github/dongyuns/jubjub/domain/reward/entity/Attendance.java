package io.github.dongyuns.jubjub.domain.reward.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "출석_체크_내역",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_attendance_profile_date", columnNames = {"고객프로필번호", "출석일자"})
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Attendance {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "출석번호")
    private Long id;

    @Column(name = "고객프로필번호", nullable = false)
    private Long memberProfileId;

    @Column(name = "출석일자", nullable = false)
    private LocalDate attendanceDate;

    @CreatedDate
    @Column(name = "생성일시", updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public Attendance(Long memberProfileId, LocalDate attendanceDate) {
        this.memberProfileId = memberProfileId;
        this.attendanceDate = attendanceDate;
    }
}