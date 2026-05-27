package io.github.dongyuns.jubjub.domain.auth.service;

import io.github.dongyuns.jubjub.domain.auth.dto.*;
import io.github.dongyuns.jubjub.domain.auth.entity.Account;
import io.github.dongyuns.jubjub.domain.auth.entity.RefreshToken;
import io.github.dongyuns.jubjub.domain.auth.entity.VerificationLog;
import io.github.dongyuns.jubjub.domain.auth.repository.AccountRepository;
import io.github.dongyuns.jubjub.domain.auth.repository.RefreshTokenRepository;
import io.github.dongyuns.jubjub.domain.auth.repository.VerificationLogRepository;
import io.github.dongyuns.jubjub.domain.user.dto.ProfileResponse;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.user.repository.MemberProfileRepository;
import io.github.dongyuns.jubjub.repository.MediaRepository;
import io.github.dongyuns.jubjub.global.config.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final VerificationLogRepository verificationLogRepository;
    private final AccountRepository accountRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final MediaRepository mediaRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;
    private final RefreshTokenRepository refreshTokenRepository; // 🌟 장기 세션 관리를 위한 저장소
    private final SmsService smsService; // 🌟 SMS 발송 서비스 주입
    private final PasswordEncoder passwordEncoder; // 암호화 기계 주입!

    /**
     * 1. 인증번호 발송 (이메일 & SMS 발송 연동)
     * 6자리 난수를 생성하여 타겟(이메일 또는 휴대폰)으로 발송하고 DB에 기록합니다.
     */
    @Transactional
    public VerificationLog sendVerificationCode(String type, String target) {
        // 1-1. 6자리 난수 생성
        String code = String.format("%06d", new Random().nextInt(1000000));

        // 1-2. 🌟 타입에 맞춰 실제 발송 로직 실행 (EMAIL or SMS)
        if ("EMAIL".equalsIgnoreCase(type)) {
            emailService.sendVerificationEmail(target, code);
        } else if ("SMS".equalsIgnoreCase(type)) {
            smsService.sendVerificationSms(target, code); // 콘솔에 문자 테스트 출력!
        } else {
            throw new IllegalArgumentException("지원하지 않는 인증 타입입니다. (EMAIL 또는 SMS만 가능)");
        }

        // 1-3. DB에 로그 저장 (유효시간 5분)
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(5);
        VerificationLog log = VerificationLog.builder()
                .type(type)
                .target(target)
                .code(code)
                .expiresAt(expiresAt)
                .build();

        return verificationLogRepository.save(log);
    }

    /**
     * 2. 인증번호 검증
     * 유저가 입력한 코드와 DB의 코드를 대조합니다. (유효시간 및 일치여부 체크)
     */
    @Transactional
    public boolean confirmVerificationCode(Long logId, String code) {
        // 2-1. 로그 ID로 인증 기록 조회
        VerificationLog log = verificationLogRepository.findById(logId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 인증 요청입니다."));

        // 2-2. 만료 시간 체크
        if (log.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("인증 시간이 만료되었습니다. 다시 요청해주세요.");
        }

        // 2-3. 일치 여부 체크
        if (!log.getCode().equals(code)) {
            throw new IllegalArgumentException("인증번호가 일치하지 않습니다.");
        }

        log.verify(); // 인증 완료 상태로 변경 (Dirty Checking)
        return log.isVerified();
    }

    /**
     * 3. 회원가입 (계정 및 프로필 생성)
     * 인증 완료 후 계정 정보와 고객 프로필을 동시에 저장합니다.
     */
    @Transactional
    public void signup(SignupRequest dto) {
        // 3-1. 이메일 중복 체크
        if (accountRepository.findByEmail(dto.email()).isPresent()) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");
        }

        // 3-2. 계정(Account) 저장
        Account account = Account.builder()
                .email(dto.email())
                // 평문 비밀번호를 BCrypt로 암호화해서 저장!
                .password(passwordEncoder.encode(dto.password()))
                .build();
        Account savedAccount = accountRepository.save(account);

        // 3-3. 고객 프로필(MemberProfile) 저장
        MemberProfile profile = MemberProfile.builder()
                .account(savedAccount)
                .name(dto.name())
                .phone(normalizePhone(dto.phone())) // 프론트에서 하이픈을 보내도 다 떼고 숫자만 저장!
                .nickname(dto.nickname())
                .build();
        memberProfileRepository.save(profile);
    }

    /**
     * 전화번호 정규화 (하이픈, 공백 등 숫자 이외의 문자 모두 제거)
     */
    private String normalizePhone(String phone) {
        if (phone == null) return null;
        return phone.replaceAll("[^0-9]", ""); // 숫자(0~9)가 아닌 문자는 ""(빈칸)으로 교체!
    }

    /**
     * 4. 로그인 및 JWT 토큰 발급 (Access + Refresh 통합)
     * 이메일/비번 검증 후, 단기 티켓(Access)과 장기 열쇠(Refresh)를 발급합니다.
     */
    @Transactional
    public LoginResponse login(LoginRequest dto) {
        // 4-1. 이메일로 계정 조회
        Account account = accountRepository.findByEmail(dto.email())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        // 4-2. 비밀번호 대조
        // 평문 대조(equals) 대신, PasswordEncoder의 matches 메서드 사용!
        // matches(입력한_평문_비밀번호, DB에_저장된_암호화된_비밀번호)
        if (!passwordEncoder.matches(dto.password(), account.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        // 4-3. 프로필 정보 조회 (응답용)
        MemberProfile profile = memberProfileRepository.findByAccount(account)
                .orElseThrow(() -> new IllegalArgumentException("프로필 정보를 찾을 수 없습니다."));

        // 탈퇴 유예 기간(30일) 내에 다시 로그인한 경우, 계정 자동 복구!
        if (account.isDeleted()) {
            account.restore(); // 계정 살리기 (isDeleted = false)
            profile.restore(); // 프로필 살리기 (isDeleted = false, deletedAt = null)
            // 💡 Dirty Checking 덕분에 따로 save를 안 해도 트랜잭션이 끝날 때 DB에 반영됩니다!
        }

        // 🌟 4-4. 토큰 세트 생성 (Access Token & Refresh Token)
        // JwtTokenProvider의 createToken 메서드를 통해 두 토큰을 한 번에 가져옵니다.
        TokenResponse tokenResponse = jwtTokenProvider.createToken(account.getEmail(), "ROLE_USER");

        // 🌟 4-5. Refresh Token DB 저장 및 최신화
        // 기존에 발급된 리프레시 토큰이 있다면 새 값으로 업데이트하고, 없다면 새로 생성합니다.
        RefreshToken refreshToken = refreshTokenRepository.findByEmail(account.getEmail())
                .map(token -> {
                    token.updateToken(tokenResponse.refreshToken());
                    return token;
                })
                .orElse(new RefreshToken(account.getEmail(), tokenResponse.refreshToken()));

        refreshTokenRepository.save(refreshToken);

        // 4-6. 로그인 응답값 반환 (Access + Refresh 모두 포함)
        return new LoginResponse(
                tokenResponse.accessToken(),
                tokenResponse.refreshToken(),
                account.getEmail(),
                profile.getNickname()
        );

    }

    /**
     * 5. 내 프로필 조회
     * 토큰에서 추출한 이메일 정보를 기반으로 현재 로그인한 사용자의 정보를 조회합니다.
     */
    @Transactional(readOnly = true)
    public ProfileResponse getMyProfile(String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 사용자입니다."));

        MemberProfile profile = memberProfileRepository.findByAccount(account)
                .orElseThrow(() -> new IllegalArgumentException("프로필 정보를 찾을 수 없습니다."));

        return new ProfileResponse(
                account.getEmail(),
                profile.getName(),
                profile.getPhone(),
                profile.getNickname(),
                mediaRepository.findFirstByOwnerTypeAndOwnerId("PROFILE", profile.getId())
                        .map(media -> media.getImagePath())
                        .orElse(null)
        );
    }

    /**
     * 6. 토큰 재발급 (Refresh Token 활용)
     * 유통기한이 지난 Access Token 대신, DB에 저장된 Refresh Token을 대조하여 새 토큰을 발급합니다.
     */
    @Transactional
    public TokenResponse reissue(String refreshToken) {
        // 6-1. 리프레시 토큰 자체의 유효성 검사 (변조 여부 등)
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new IllegalArgumentException("유효하지 않거나 만료된 리프레시 토큰입니다. 다시 로그인해주세요.");
        }

        // 6-2. 토큰에서 사용자 이메일 추출
        String email = jwtTokenProvider.getEmail(refreshToken);

        // 6-3. DB에 저장된 실제 토큰과 일치하는지 대조 (보안의 핵심!)
        RefreshToken savedToken = refreshTokenRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("로그인 기록이 없는 사용자입니다."));

        if (!savedToken.getToken().equals(refreshToken)) {
            throw new IllegalArgumentException("토큰 정보가 일치하지 않습니다. 보안 위협이 감지되었습니다.");
        }

        // 6-4. 🌟 검증 완료! 새로운 토큰 세트(Access + Refresh) 생성
        TokenResponse newTokenResponse = jwtTokenProvider.createToken(email, "ROLE_USER");

        // 6-5. DB의 리프레시 토큰도 새것으로 업데이트 (RTR 방식: Refresh Token Rotation)
        savedToken.updateToken(newTokenResponse.refreshToken());

        return newTokenResponse;
    }

    /**
     * 7. 아이디(이메일) 찾기
     * 이름과 휴대폰 번호로 가입된 계정을 찾고, 이메일 일부를 마스킹하여 반환합니다.
     */
    @Transactional(readOnly = true)
    public String findId(FindIdRequest dto) {
        // 조회할 때도 유저 입력값에서 숫자만 걸러냄!
        String cleanPhone = normalizePhone(dto.phone());

        // 1. 이름과 전화번호로 프로필 조회
        MemberProfile profile = memberProfileRepository.findByNameAndPhone(dto.name(), cleanPhone)
                .orElseThrow(() -> new IllegalArgumentException("입력하신 정보와 일치하는 계정이 없습니다."));

        // 2. 해당 프로필과 연결된 이메일 가져오기
        String email = profile.getAccount().getEmail();

        // 3. 보안을 위해 이메일 마스킹 처리 (예: junho3162@naver.com -> jun***@naver.com)
        return maskEmail(email);
    }

    // 이메일 마스킹 처리를 위한 내부 헬퍼 메서드
    private String maskEmail(String email) {
        int atIndex = email.indexOf("@");
        if (atIndex <= 3) { // 아이디가 3글자 이하인 경우
            return email.substring(0, 1) + "***" + email.substring(atIndex);
        }
        // 아이디의 앞 3글자만 보여주고 나머지는 *** 처리
        return email.substring(0, 3) + "***" + email.substring(atIndex);
    }

    /**
     * 8. 비밀번호 재설정
     * 이메일 인증이 완료된 사용자에 한해 새로운 비밀번호로 변경(암호화)해 줍니다.
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest dto) {
        // 1. 인증 기록 조회
        VerificationLog log = verificationLogRepository.findById(dto.logId())
                .orElseThrow(() -> new IllegalArgumentException("인증 기록을 찾을 수 없습니다."));

        // 2. 보안 검증: 해당 로그가 입력한 이메일의 것이 맞는지, 그리고 인증(verify)을 통과했는지 확인
        if (!log.getTarget().equals(dto.email()) || !log.isVerified()) {
            throw new IllegalArgumentException("이메일 인증이 완료되지 않았거나 정보가 일치하지 않습니다.");
        }

        // 3. 계정 조회
        Account account = accountRepository.findByEmail(dto.email())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 계정입니다."));

        // 4. 🌟 비밀번호 업데이트 (새 비밀번호도 반드시 암호화해서 저장!)
        account.updatePassword(passwordEncoder.encode(dto.newPassword()));
    }

    /**
     * 9. 비밀번호 찾기용 인증번호 발송
     * 가입된 이메일인지 확인 후, 해당 이메일로 비밀번호 재설정용 인증번호를 보냅니다.
     */
    @Transactional
    public VerificationLog sendResetPasswordCode(String email) {
        // 1. 가입된 계정인지 확인
        accountRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        // 2. 기존에 만든 인증번호 발송 로직 재활용 (타입은 EMAIL 고정)
        return sendVerificationCode("EMAIL", email);
    }

    /**
     * 10. 기존 비밀번호 확인 후 변경 (로그인 상태 전용)
     * 현재 로그인한 사용자의 기존 비밀번호를 대조한 후 새 비밀번호로 교체합니다.
     */
    @Transactional
    public void changePassword(String email, ChangePasswordRequest dto) {
        // 1. 토큰에서 가져온 이메일로 계정 조회
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 2. 기존 비밀번호 일치 여부 확인 (BCrypt matches 사용)
        if (!passwordEncoder.matches(dto.currentPassword(), account.getPassword())) {
            throw new IllegalArgumentException("기존 비밀번호가 일치하지 않습니다.");
        }

        // 3. (선택사항) 새 비밀번호가 기존과 같은지 체크하면 더 좋습니다!
        if (passwordEncoder.matches(dto.newPassword(), account.getPassword())) {
            throw new IllegalArgumentException("기존과 동일한 비밀번호로는 변경할 수 없습니다.");
        }

        // 4. 새 비밀번호 암호화 후 업데이트
        account.updatePassword(passwordEncoder.encode(dto.newPassword()));
    }

}
