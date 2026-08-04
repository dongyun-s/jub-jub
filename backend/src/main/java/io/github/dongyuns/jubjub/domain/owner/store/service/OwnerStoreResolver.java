package io.github.dongyuns.jubjub.domain.owner.store.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.core.account.entity.Account;
import io.github.dongyuns.jubjub.domain.core.account.entity.AccountRole;
import io.github.dongyuns.jubjub.domain.core.account.repository.AccountRepository;
import io.github.dongyuns.jubjub.domain.core.member.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.core.member.repository.MemberProfileRepository;
import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.core.store.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OwnerStoreResolver {

    private final AccountRepository accountRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final StoreRepository storeRepository;

    @Transactional(readOnly = true)
    public Store getCurrentOwnerStore(String accountEmail) {
        if (accountEmail == null || accountEmail.isBlank()) {
            throw new BusinessException("UNAUTHORIZED", "로그인한 사장님만 접근할 수 있습니다.", HttpStatus.UNAUTHORIZED);
        }

        Account account = accountRepository.findByEmail(accountEmail)
                .orElseThrow(() -> new BusinessException("ACCOUNT_NOT_FOUND", "로그인 계정을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        if (account.getRole() != AccountRole.OWNER) {
            throw new BusinessException("OWNER_FORBIDDEN", "사장님 계정만 접근할 수 있습니다.", HttpStatus.FORBIDDEN);
        }

        MemberProfile profile = memberProfileRepository.findByAccount(account)
                .orElseThrow(() -> new BusinessException("MEMBER_PROFILE_NOT_FOUND", "회원 프로필을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        return storeRepository.findByOwnerProfileId(profile.getId())
                .orElseThrow(() -> new BusinessException("OWNER_STORE_NOT_FOUND", "사장님 매장을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
    }
}
