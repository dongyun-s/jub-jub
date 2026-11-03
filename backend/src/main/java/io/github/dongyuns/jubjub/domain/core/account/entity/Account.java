package io.github.dongyuns.jubjub.domain.core.account.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "account")
@Getter @NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Account {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'USER'")
    private AccountRole role = AccountRole.USER;

    @Builder
    public Account(String email, String password, AccountRole role) {
        this.email = email;
        this.password = password;
        this.role = role == null ? AccountRole.USER : role;
    }
    // 비밀번호 변경(재설정)을 위한 메서드
    public void updatePassword(String newPassword) {
        this.password = newPassword;
    }

    // 역할 변경 메서드 (USER → OWNER)
    public void updateRole(AccountRole newRole) {
        this.role = newRole;
    }

    // 탈퇴 여부 플래그
    @Column(nullable = false)
    private boolean isDeleted = false;

    // Soft Delete 메서드
    public void softDelete() {
        this.isDeleted = true;
    }

    // 30일 후 익명화(비식별화) 처리 메서드
    public void anonymize(String uuid) {
        this.email = "deleted_" + uuid + "@jubjub.com"; // 가짜 이메일로 덮어쓰기
        this.password = "deleted"; // 비밀번호 무효화
    }

    // 계정 복구 (탈퇴 취소)
    public void restore() {
        this.isDeleted = false;
    }
}