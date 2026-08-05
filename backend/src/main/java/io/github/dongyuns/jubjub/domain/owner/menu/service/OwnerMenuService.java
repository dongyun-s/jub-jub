package io.github.dongyuns.jubjub.domain.owner.menu.service;

import io.github.dongyuns.jubjub.domain.core.media.service.MediaCrudService;
import io.github.dongyuns.jubjub.domain.core.menu.entity.Menu;
import io.github.dongyuns.jubjub.domain.core.menu.repository.MenuRepository;
import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.owner.menu.dto.OwnerMenuCreateRequest;
import io.github.dongyuns.jubjub.domain.owner.menu.dto.OwnerMenuListResponse;
import io.github.dongyuns.jubjub.domain.owner.menu.dto.OwnerMenuResponse;
import io.github.dongyuns.jubjub.domain.owner.menu.dto.OwnerMenuUpdateRequest;
import io.github.dongyuns.jubjub.domain.owner.store.service.OwnerStoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OwnerMenuService {

    private final MenuRepository menuRepository;
    private final OwnerStoreService ownerStoreService;
    private final MediaCrudService mediaCrudService;

    /**
     * 현재 로그인한 사장님의 이메일
     */
    private String getCurrentAccountEmail() {
        return (String) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
    }

    /**
     * 현재 로그인한 사장님의 메뉴 조회
     */
    private Menu getOwnerMenu(Long menuId) {

        Store store = ownerStoreService.getCurrentStore(getCurrentAccountEmail());

        return menuRepository
                .findByIdAndStoreIdAndIsDeletedFalse(menuId, store.getId())
                .orElseThrow(() ->
                        new IllegalArgumentException("메뉴를 찾을 수 없습니다."));
    }

    /**
     * 메뉴 등록
     */
    @Transactional
    public OwnerMenuResponse createMenu(OwnerMenuCreateRequest request) {

        Store store = ownerStoreService.getCurrentStore(getCurrentAccountEmail());

        Menu menu = Menu.builder()
                .store(store)
                .name(request.name())
                .price(request.price())
                .description(request.description())
                .category(request.category())
                .isSpicy(Boolean.TRUE.equals(request.isSpicy()))
                .isVegetarian(Boolean.TRUE.equals(request.isVegetarian()))
                .isBest(Boolean.TRUE.equals(request.isBest()))
                .isSoldOut(false)
                .rewardXp(0)
                .build();

        Menu savedMenu = menuRepository.save(menu);

        // 메뉴 이미지 저장
        if (StringUtils.hasText(request.imageUrl())) {
            mediaCrudService.createMenuImage(
                    savedMenu.getId(),
                    request.imageUrl()
            );
        }

        return new OwnerMenuResponse(
                savedMenu.getId(),
                "메뉴가 등록되었습니다."
        );
    }

    /**
     * 메뉴 목록 조회
     */
    @Transactional(readOnly = true)
    public List<OwnerMenuListResponse> getMenus() {

        Store store = ownerStoreService.getCurrentStore(getCurrentAccountEmail());

        return menuRepository.findByStoreIdAndIsDeletedFalse(store.getId())
                .stream()
                .map(menu -> new OwnerMenuListResponse(
                        menu.getId(),
                        menu.getName(),
                        menu.getPrice(),
                        menu.getDescription(),
                        menu.getCategory(),
                        mediaCrudService.getMenuImage(menu.getId()),
                        menu.isSpicy(),
                        menu.isVegetarian(),
                        menu.isBest(),
                        menu.isSoldOut()
                ))
                .toList();
    }

    /**
     * 메뉴 수정
     */
    @Transactional
    public OwnerMenuResponse updateMenu(
            Long menuId,
            OwnerMenuUpdateRequest request
    ) {

        Menu menu = getOwnerMenu(menuId);

        menu.updateMenu(
                request.name(),
                request.description(),
                request.price(),
                request.category(),
                Boolean.TRUE.equals(request.isSpicy()),
                Boolean.TRUE.equals(request.isVegetarian()),
                Boolean.TRUE.equals(request.isBest())
        );

        // 이미지 처리
        if (StringUtils.hasText(request.imageUrl())) {

            String currentImage =
                    mediaCrudService.getMenuImage(menuId);

            if (currentImage == null) {
                mediaCrudService.createMenuImage(
                        menuId,
                        request.imageUrl()
                );
            } else {
                mediaCrudService.updateMenuImage(
                        menuId,
                        request.imageUrl()
                );
            }

        } else {

            mediaCrudService.deleteMenuImage(menuId);

        }

        return new OwnerMenuResponse(
                menu.getId(),
                "메뉴가 수정되었습니다."
        );
    }

    /**
     * 메뉴 삭제 (Soft Delete)
     */
    @Transactional
    public void deleteMenu(Long menuId) {

        Menu menu = getOwnerMenu(menuId);

        menu.delete();

        // 메뉴 이미지도 함께 삭제
        mediaCrudService.deleteMenuImage(menuId);
    }

    /**
     * 메뉴 품절 / 판매 재개
     */
    @Transactional
    public OwnerMenuResponse updateSoldOut(
            Long menuId,
            boolean soldOut
    ) {

        Menu menu = getOwnerMenu(menuId);

        menu.updateSoldOut(soldOut);

        return new OwnerMenuResponse(
                menu.getId(),
                soldOut
                        ? "메뉴가 품절 처리되었습니다."
                        : "메뉴 판매가 재개되었습니다."
        );
    }
}