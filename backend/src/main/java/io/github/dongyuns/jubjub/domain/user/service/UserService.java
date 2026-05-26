package io.github.dongyuns.jubjub.domain.user.service;

import io.github.dongyuns.jubjub.domain.auth.entity.Account;
import io.github.dongyuns.jubjub.domain.auth.repository.AccountRepository;
import io.github.dongyuns.jubjub.domain.auth.repository.RefreshTokenRepository;
import io.github.dongyuns.jubjub.domain.user.dto.ProfileUpdateRequest;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.user.repository.MemberProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final AccountRepository accountRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    // 프로필 수정 (닉네임, 전화번호)
    @Transactional
    public void updateProfile(String email, ProfileUpdateRequest request) {
        // 가장 안전하고 확실한 2단계 조회 방식으로 변경!
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        MemberProfile profile = memberProfileRepository.findByAccount(account)
                .orElseThrow(() -> new IllegalArgumentException("프로필 정보를 찾을 수 없습니다."));

        // 2. 엔티티에 만들어둔 수정 메서드 호출 (JPA Dirty Checking으로 DB 자동 반영!)
        profile.updateProfile(request.nickname(), request.phone());
    }

    // 2. 회원 탈퇴 (Soft Delete) 🌟
    @Transactional
    public void withdraw(String email, String rawPassword) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 사용자입니다."));

        // 이미 탈퇴한 계정인지 방어 로직 추가
        if (account.isDeleted()) {
            throw new IllegalArgumentException("이미 탈퇴 처리된 계정입니다.");
        }

        // 비밀번호 검증
        if (!passwordEncoder.matches(rawPassword, account.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다. 다시 입력해 주세요.");
        }

        MemberProfile profile = memberProfileRepository.findByAccount(account)
                .orElseThrow(() -> new IllegalArgumentException("프로필 정보를 찾을 수 없습니다."));

        // 🗑️ 1. 즉시 로그아웃을 위해 리프레시 토큰만 진짜 삭제 (Hard Delete)
        refreshTokenRepository.deleteByEmail(email);

        // 👻 2. 계정과 프로필은 Soft Delete (상태값만 변경, 데이터 유지)
        account.softDelete();
        profile.softDelete();
    }
}