package io.github.dongyuns.jubjub.domain.auth.entity;

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

    @Builder
    public Account(String email, String password) {
        this.email = email;
        this.password = password;
    }
    // 비밀번호 변경(재설정)을 위한 메서드
    public void updatePassword(String newPassword) {
        this.password = newPassword;
    }
}