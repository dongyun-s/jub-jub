package io.github.dongyuns.jubjub.domain.favorite.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.favorite.dto.FavoriteStoreResponse;
import io.github.dongyuns.jubjub.domain.favorite.entity.StoreFavorite;
import io.github.dongyuns.jubjub.domain.favorite.repository.StoreFavoriteRepository;
import io.github.dongyuns.jubjub.domain.store.entity.Store;
import io.github.dongyuns.jubjub.domain.store.repository.StoreRepository;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.user.repository.MemberProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class StoreFavoriteService {

    private final StoreFavoriteRepository favoriteRepository;
    private final StoreRepository storeRepository;
    private final MemberProfileRepository memberProfileRepository;

    /**
     * 찜하기 / 취소 (토글)
     */
    public String toggleFavorite(String accountEmail, Long storeId) {
        MemberProfile member = resolveMemberProfile(accountEmail);
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new BusinessException("STORE_NOT_FOUND", "매장을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        Optional<StoreFavorite> existingFavorite = favoriteRepository.findByMemberProfileIdAndStoreId(member.getId(), storeId);

        if (existingFavorite.isPresent()) {
            favoriteRepository.delete(existingFavorite.get());
            return "매장 찜이 해제되었습니다. 💔";
        } else {
            StoreFavorite newFavorite = StoreFavorite.builder()
                    .memberProfile(member)
                    .store(store)
                    .build();
            favoriteRepository.save(newFavorite);
            return "매장을 찜했습니다! ❤️";
        }
    }

    /**
     * 내 찜 목록 조회
     */
    @Transactional(readOnly = true)
    public List<FavoriteStoreResponse> getMyFavorites(String accountEmail) {
        MemberProfile member = resolveMemberProfile(accountEmail);
        List<StoreFavorite> favorites = favoriteRepository.findAllByMemberProfileId(member.getId());

        return favorites.stream()
                .map(fav -> {
                    Store store = fav.getStore();

                    // 🌟 [수정된 부분] DB에 있는 categoryId(숫자)를 프론트엔드용 글자(String)로 변환!
                    String categoryStr = "기타"; // 기본값
                    if (store.getCategoryId() != null) {
                        if (store.getCategoryId() == 1) {
                            categoryStr = "샐러드";
                        } else if (store.getCategoryId() == 2) {
                            categoryStr = "버거";
                        }
                    }

                    return FavoriteStoreResponse.builder()
                            .favoriteId(fav.getId())
                            .storeId(store.getId())
                            .storeName(store.getName())
                            .categoryName(categoryStr) // 👈 고정된 "카페/디저트" 대신 변환된 글자 넣기!
                            .storeImageUrl("https://via.placeholder.com/150") // 더미 이미지
                            .rating(4.5)
                            .reviewCount(120)
                            .distance(350)
                            .tags(List.of("분위기 좋음", "배달 맛집"))
                            .storeStatus(store.getStatus())
                            .build();
                })
                .collect(Collectors.toList());
    }

    // 💡 주의: 기존 장바구니나 멤버 레포지토리에 이메일로 프로필 찾는 메서드가 어떻게 생겼는지 확인해주세요!
    // (예: findByAccount_Email 혹은 findByAccountEmail)
    private MemberProfile resolveMemberProfile(String accountEmail) {
        return memberProfileRepository.findByAccountEmail(accountEmail)
                .orElseThrow(() -> new BusinessException("MEMBER_PROFILE_NOT_FOUND", "회원 프로필을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
    }
}