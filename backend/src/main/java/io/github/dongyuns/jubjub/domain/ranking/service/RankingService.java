package io.github.dongyuns.jubjub.domain.ranking.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.ranking.dto.MyRankingResponse;
import io.github.dongyuns.jubjub.domain.ranking.dto.RankingItemResponse;
import io.github.dongyuns.jubjub.domain.ranking.dto.RankingListResponse;
import io.github.dongyuns.jubjub.domain.ranking.repository.RankingProjection;
import io.github.dongyuns.jubjub.domain.ranking.repository.RankingRepository;
import io.github.dongyuns.jubjub.domain.reward.enums.RewardTier;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.user.repository.MemberProfileRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RankingService {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 100;

    private final RankingRepository rankingRepository;
    private final MemberProfileRepository memberProfileRepository;

    @Transactional(readOnly = true)
    public RankingListResponse getRankings(Integer page, Integer size) {
        int normalizedPage = normalizePage(page);
        int normalizedSize = normalizeSize(size);
        long offset = (long) normalizedPage * normalizedSize;

        List<RankingItemResponse> rankings = rankingRepository.findRankings(normalizedSize, offset).stream()
                .map(this::toRankingItemResponse)
                .toList();

        return new RankingListResponse(
                normalizedPage,
                normalizedSize,
                rankingRepository.countByIsDeletedFalse(),
                rankings
        );
    }

    @Transactional(readOnly = true)
    public MyRankingResponse getMyRanking(String accountEmail) {
        MemberProfile profile = memberProfileRepository.findByAccountEmail(accountEmail)
                .orElseThrow(() -> new BusinessException(
                        "MEMBER_NOT_FOUND",
                        "회원 정보를 찾을 수 없습니다.",
                        HttpStatus.NOT_FOUND
                ));

        long ranking = rankingRepository.countUsersAhead(
                profile.getId(),
                profile.getTotalWalkingDistance(),
                profile.getOrderCount()
        ) + 1;

        RankingProjection rankingProfile = rankingRepository.findRankingProfile(profile.getId());
        if (rankingProfile == null) {
            throw new BusinessException(
                    "DELETED_MEMBER_NOT_RANKED",
                    "탈퇴한 회원은 랭킹 조회 대상이 아닙니다.",
                    HttpStatus.NOT_FOUND
            );
        }

        RewardTier tier = RewardTier.fromCode(rankingProfile.getTierCode());
        return new MyRankingResponse(
                ranking,
                rankingRepository.countByIsDeletedFalse(),
                rankingProfile.getUserId(),
                rankingProfile.getNickname(),
                rankingProfile.getProfileImageUrl(),
                tier,
                tier.getLabel(),
                normalizeDistance(rankingProfile.getTotalDistanceKm()),
                rankingProfile.getPickupCount()
        );
    }

    private RankingItemResponse toRankingItemResponse(RankingProjection projection) {
        RewardTier tier = RewardTier.fromCode(projection.getTierCode());

        return new RankingItemResponse(
                projection.getRanking(),
                projection.getUserId(),
                projection.getNickname(),
                projection.getProfileImageUrl(),
                tier,
                tier.getLabel(),
                normalizeDistance(projection.getTotalDistanceKm()),
                projection.getPickupCount()
        );
    }

    private int normalizePage(Integer page) {
        if (page == null) {
            return DEFAULT_PAGE;
        }
        if (page < 0) {
            throw new BusinessException("INVALID_PAGE", "page는 0 이상이어야 합니다.", HttpStatus.BAD_REQUEST);
        }
        return page;
    }

    private int normalizeSize(Integer size) {
        if (size == null) {
            return DEFAULT_SIZE;
        }
        if (size <= 0) {
            throw new BusinessException("INVALID_SIZE", "size는 1 이상이어야 합니다.", HttpStatus.BAD_REQUEST);
        }
        if (size > MAX_SIZE) {
            throw new BusinessException("INVALID_SIZE", "size는 최대 100까지 허용됩니다.", HttpStatus.BAD_REQUEST);
        }
        return size;
    }

    private BigDecimal normalizeDistance(BigDecimal distanceKm) {
        if (distanceKm == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return distanceKm.setScale(2, RoundingMode.HALF_UP);
    }
}
