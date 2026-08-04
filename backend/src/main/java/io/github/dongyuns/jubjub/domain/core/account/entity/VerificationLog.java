package io.github.dongyuns.jubjub.domain.core.account.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "verification_log")
@Getter @NoArgsConstructor(access = AccessLevel.PROTECTED)
public class VerificationLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String type; // SMS, EMAIL

    @Column(nullable = false)
    private String target; // 전화번호 또는 이메일

    @Column(nullable = false)
    private String code; // 6자리 난수

    private boolean isVerified = false;

    private LocalDateTime expiresAt;
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder
    public VerificationLog(String type, String target, String code, LocalDateTime expiresAt) {
        this.type = type;
        this.target = target;
        this.code = code;
        this.expiresAt = expiresAt;
    }

    // 인증 완료 상태 변경 메서드
    public void verify() {
        this.isVerified = true;
    }
}