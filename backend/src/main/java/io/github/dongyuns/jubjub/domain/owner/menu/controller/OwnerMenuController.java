package io.github.dongyuns.jubjub.domain.owner.menu.controller;

import io.github.dongyuns.jubjub.common.response.ApiResponse;
import io.github.dongyuns.jubjub.domain.owner.menu.dto.OwnerMenuCreateRequest;
import io.github.dongyuns.jubjub.domain.owner.menu.dto.OwnerMenuListResponse;
import io.github.dongyuns.jubjub.domain.owner.menu.dto.OwnerMenuResponse;
import io.github.dongyuns.jubjub.domain.owner.menu.dto.OwnerMenuUpdateRequest;
import io.github.dongyuns.jubjub.domain.owner.menu.service.OwnerMenuService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Owner Menu", description = "사장님 메뉴 관리 API")
@RestController
@RequestMapping("/api/v1/owner/menu")
@RequiredArgsConstructor
public class OwnerMenuController {

    private final OwnerMenuService ownerMenuService;

    /**
     * 메뉴 등록
     */
    @Operation(summary = "메뉴 등록", description = "사장님이 새로운 메뉴를 등록합니다.")
    @PostMapping
    public ApiResponse<OwnerMenuResponse> createMenu(
            @RequestBody OwnerMenuCreateRequest request
    ) {

        OwnerMenuResponse response = ownerMenuService.createMenu(request);

        return ApiResponse.success(response);
    }

    /**
     * 메뉴 목록 조회
     */
    @Operation(summary = "메뉴 목록 조회", description = "로그인한 사장님의 메뉴 목록을 조회합니다.")
    @GetMapping
    public ApiResponse<List<OwnerMenuListResponse>> getMenus() {

        List<OwnerMenuListResponse> response = ownerMenuService.getMenus();

        return ApiResponse.success(response);
    }

    /**
     * 메뉴 수정
     */
    @Operation(summary = "메뉴 수정", description = "사장님이 메뉴 정보를 수정합니다.")
    @PutMapping("/{menuId}")
    public ApiResponse<OwnerMenuResponse> updateMenu(
            @PathVariable Long menuId,
            @RequestBody OwnerMenuUpdateRequest request
    ) {

        OwnerMenuResponse response =
                ownerMenuService.updateMenu(menuId, request);

        return ApiResponse.success(response);
    }

    /**
     * 메뉴 삭제 (Soft Delete)
     */
    @Operation(summary = "메뉴 삭제", description = "메뉴를 삭제(숨김 처리)합니다.")
    @DeleteMapping("/{menuId}")
    public ApiResponse<String> deleteMenu(
            @PathVariable Long menuId
    ) {

        ownerMenuService.deleteMenu(menuId);

        return ApiResponse.success("메뉴가 삭제되었습니다.");
    }

    /**
     * 메뉴 품절 / 판매 재개
     */
    @Operation(summary = "메뉴 품절 변경", description = "메뉴의 품절 여부를 변경합니다.")
    @PatchMapping("/{menuId}/sold-out")
    public ApiResponse<OwnerMenuResponse> updateSoldOut(
            @PathVariable Long menuId,
            @RequestParam boolean soldOut
    ) {

        OwnerMenuResponse response =
                ownerMenuService.updateSoldOut(menuId, soldOut);

        return ApiResponse.success(response);
    }
}