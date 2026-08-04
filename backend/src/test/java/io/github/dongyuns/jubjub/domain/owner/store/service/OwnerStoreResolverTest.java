package io.github.dongyuns.jubjub.domain.owner.store.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.core.account.entity.Account;
import io.github.dongyuns.jubjub.domain.core.account.entity.AccountRole;
import io.github.dongyuns.jubjub.domain.core.account.repository.AccountRepository;
import io.github.dongyuns.jubjub.domain.core.member.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.core.member.repository.MemberProfileRepository;
import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.core.store.repository.StoreRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OwnerStoreResolverTest {

    @Mock private AccountRepository accountRepository;
    @Mock private MemberProfileRepository memberProfileRepository;
    @Mock private StoreRepository storeRepository;

    private OwnerStoreResolver ownerStoreResolver;

    @BeforeEach
    void setUp() {
        ownerStoreResolver = new OwnerStoreResolver(accountRepository, memberProfileRepository, storeRepository);
    }

    @Test
    void resolvesStoreFromOwnerAccount() {
        Account account = account("owner@example.com", AccountRole.OWNER);
        MemberProfile profile = profile(account, 20L);
        Store store = Store.builder().ownerProfileId(20L).name("사장님 매장").build();
        when(accountRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(account));
        when(memberProfileRepository.findByAccount(account)).thenReturn(Optional.of(profile));
        when(storeRepository.findByOwnerProfileId(20L)).thenReturn(Optional.of(store));

        Store result = ownerStoreResolver.getCurrentOwnerStore("owner@example.com");

        assertThat(result).isSameAs(store);
    }

    @Test
    void rejectsCustomerAccount() {
        Account account = account("customer@example.com", AccountRole.USER);
        when(accountRepository.findByEmail("customer@example.com")).thenReturn(Optional.of(account));

        assertThatThrownBy(() -> ownerStoreResolver.getCurrentOwnerStore("customer@example.com"))
                .isInstanceOf(BusinessException.class)
                .extracting("code")
                .isEqualTo("OWNER_FORBIDDEN");
    }

    private Account account(String email, AccountRole role) {
        return Account.builder().email(email).password("password").role(role).build();
    }

    private MemberProfile profile(Account account, Long id) {
        MemberProfile profile = MemberProfile.builder()
                .account(account)
                .name("사장님")
                .phone("01033334444")
                .nickname("사장님")
                .build();
        setField(profile, "id", id);
        return profile;
    }

    private void setField(Object target, String fieldName, Object value) {
        try {
            java.lang.reflect.Field field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException exception) {
            throw new IllegalStateException(fieldName + " 필드 설정에 실패했습니다.", exception);
        }
    }
}
