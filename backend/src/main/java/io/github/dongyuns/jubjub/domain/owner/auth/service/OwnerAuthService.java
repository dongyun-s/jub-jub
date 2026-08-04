package io.github.dongyuns.jubjub.domain.owner.auth.service;

import io.github.dongyuns.jubjub.domain.core.account.entity.Account;
import io.github.dongyuns.jubjub.domain.core.account.entity.AccountRole;
import io.github.dongyuns.jubjub.domain.core.account.entity.VerificationLog;
import io.github.dongyuns.jubjub.domain.core.account.repository.AccountRepository;
import io.github.dongyuns.jubjub.domain.core.account.repository.VerificationLogRepository;
import io.github.dongyuns.jubjub.domain.core.member.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.core.member.repository.MemberProfileRepository;
import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.core.store.entity.StoreCategory;
import io.github.dongyuns.jubjub.domain.core.store.repository.StoreRepository;
import io.github.dongyuns.jubjub.domain.shared.external.tmap.AddressGeocoder;
import io.github.dongyuns.jubjub.domain.shared.external.tmap.GeocodingResult;
import io.github.dongyuns.jubjub.domain.owner.auth.dto.OwnerSignupRequest;
import io.github.dongyuns.jubjub.domain.owner.auth.dto.OwnerRegisterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class OwnerAuthService {

    private final AccountRepository accountRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final StoreRepository storeRepository;
    private final VerificationLogRepository verificationLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final AddressGeocoder addressGeocoder;

    @Transactional
    public void signup(OwnerSignupRequest request) {

        // 이메일 공백 제거
        String email = request.email().trim();

        // 1. 기존 Account 확인
        boolean isExistingUser = accountRepository.findByEmail(email).isPresent();

        if (isExistingUser) {
            // 기존 이메일: 인증 불필요 (USER → OWNER 전환)
            signupWithExistingEmail(email, request);
        } else {
            // 신규 이메일: 인증 필요
            signupWithNewEmail(email, request);
        }
    }

    /**
     * 신규 이메일로 Owner 회원가입
     * (이메일 인증 완료 후)
     */
    private void signupWithNewEmail(String email, OwnerSignupRequest request) {

        // 1. 이메일 인증 검증
        if (request.logId() == null) {
            throw new IllegalArgumentException("신규 이메일은 인증이 필수입니다. logId를 제공해주세요.");
        }

        VerificationLog log = verificationLogRepository.findById(request.logId())
                .orElseThrow(() -> new IllegalArgumentException("인증 기록을 찾을 수 없습니다."));

        // 2. 인증 여부 확인
        if (!log.isVerified()) {
            throw new IllegalArgumentException("이메일 인증이 완료되지 않았습니다.");
        }

        // 3. 인증 대상이 요청 이메일과 일치하는지 확인
        if (!log.getTarget().equals(email)) {
            throw new IllegalArgumentException("인증 이메일이 요청 이메일과 일치하지 않습니다.");
        }

        // 4. 인증 시간 확인
        if (log.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("인증 시간이 만료되었습니다.");
        }

        // 5. Account 생성 (OWNER role)
        Account account = Account.builder()
                .email(email)
                .password(passwordEncoder.encode(request.password()))
                .role(AccountRole.OWNER)
                .build();

        Account savedAccount = accountRepository.save(account);

        // 6. MemberProfile 생성
        MemberProfile profile = MemberProfile.builder()
                .account(savedAccount)
                .name(request.ownerName())
                .phone(normalizePhone(request.ownerPhone()))
                .nickname(request.ownerName())
                .build();

        MemberProfile savedProfile = memberProfileRepository.save(profile);

        // 7. Store 생성
        storeRepository.save(createStore(
                savedProfile.getId(),
                request.storeName(),
                request.storePhone(),
                request.address(),
                request.categoryId()
        ));
    }

    /**
     * 기존 이메일(USER)로 Owner 회원가입
     * (이메일 인증 불필요, USER → OWNER 전환)
     */
    private void signupWithExistingEmail(String email, OwnerSignupRequest request) {

        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 기존 Account의 role이 이미 OWNER인지 확인
        if (account.getRole() == AccountRole.OWNER) {
            throw new IllegalArgumentException("이미 사장님으로 등록된 이메일입니다.");
        }

        MemberProfile profile = memberProfileRepository.findByAccount(account)
                .orElseThrow(() -> new IllegalArgumentException("프로필 정보를 찾을 수 없습니다."));

        validateStoreNotRegistered(profile.getId());

        // Store 생성
        storeRepository.save(createStore(
                profile.getId(),
                request.storeName(),
                request.storePhone(),
                request.address(),
                request.categoryId()
        ));

        // Account.role을 OWNER로 변경
        account.updateRole(AccountRole.OWNER);
    }

    /**
     * 기존 USER → OWNER로 전환
     * (로그인 상태에서만 가능)
     * - 이메일 인증 불필요
     * - 기존 Account와 MemberProfile 재사용
     * - Store만 새로 생성
     * - Account.role을 OWNER로 변경
     */
    @Transactional
    public void register(String email, OwnerRegisterRequest request) {

        // 1. 기존 Account 조회
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 2. 기존 MemberProfile 조회
        MemberProfile profile = memberProfileRepository.findByAccount(account)
                .orElseThrow(() -> new IllegalArgumentException("프로필 정보를 찾을 수 없습니다."));

        validateStoreNotRegistered(profile.getId());

        // 3. Store 생성
        storeRepository.save(createStore(
                profile.getId(),
                request.storeName(),
                request.storePhone(),
                request.address(),
                request.categoryId()
        ));

        // 4. Account.role을 OWNER로 변경
        account.updateRole(AccountRole.OWNER);
    }

    /**
     * 전화번호 숫자만 저장
     */
    private String normalizePhone(String phone) {

        if (phone == null || phone.isBlank()) {
            return "";
        }

        return phone.replaceAll("[^0-9]", "");
    }

    private void validateStoreNotRegistered(Long ownerProfileId) {
        if (storeRepository.existsByOwnerProfileId(ownerProfileId)) {
            throw new IllegalArgumentException("이미 등록된 사장님 매장이 있습니다.");
        }
    }

    private Store createStore(
            Long ownerProfileId,
            String storeName,
            String storePhone,
            String address,
            Integer categoryId
    ) {
        StoreCategory category = requireCategory(categoryId);
        GeocodingResult coordinates = addressGeocoder.geocode(address);

        return Store.builder()
                .ownerProfileId(ownerProfileId)
                .name(storeName)
                .phoneNumber(normalizePhone(storePhone))
                .address(address.trim())
                .categoryId(category.getId())
                .latitude(coordinates.latitude())
                .longitude(coordinates.longitude())
                .build();
    }

    private StoreCategory requireCategory(Integer categoryId) {
        if (categoryId == null) {
            throw new IllegalArgumentException("매장 카테고리는 필수입니다.");
        }
        return StoreCategory.fromId(categoryId);
    }
}
