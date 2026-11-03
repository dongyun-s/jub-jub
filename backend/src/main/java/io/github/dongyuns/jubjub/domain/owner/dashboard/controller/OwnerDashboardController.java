package io.github.dongyuns.jubjub.domain.owner.dashboard.controller;

import io.github.dongyuns.jubjub.common.response.ApiResponse;
import io.github.dongyuns.jubjub.domain.owner.dashboard.dto.OwnerDashboardResponse;
import io.github.dongyuns.jubjub.domain.owner.dashboard.service.OwnerDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/owner/dashboard")
@RequiredArgsConstructor
public class OwnerDashboardController {

    private final OwnerDashboardService ownerDashboardService;

    @GetMapping
    public ApiResponse<OwnerDashboardResponse> getDashboard(Authentication authentication) {
        return ApiResponse.success(ownerDashboardService.getDashboard(authentication.getName()));
    }
}
