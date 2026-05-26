package io.github.dongyuns.jubjub.domain.ranking.controller;

import io.github.dongyuns.jubjub.domain.ranking.dto.MyRankingResponse;
import io.github.dongyuns.jubjub.domain.ranking.dto.RankingListResponse;
import io.github.dongyuns.jubjub.domain.ranking.service.RankingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Ranking API", description = "누적 도보 거리 기준 사용자 랭킹 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/rankings")
public class RankingController {

    private final RankingService rankingService;

    @Operation(summary = "전체 랭킹 목록 조회", description = "누적거리, 픽업횟수, userId 순서로 랭킹을 조회합니다.")
    @GetMapping
    public RankingListResponse getRankings(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return rankingService.getRankings(page, size);
    }

    @Operation(summary = "내 랭킹 조회", description = "현재 로그인한 사용자의 전체 랭킹 순위를 조회합니다.")
    @GetMapping("/me")
    public MyRankingResponse getMyRanking(Authentication authentication) {
        return rankingService.getMyRanking(authentication.getName());
    }
}
