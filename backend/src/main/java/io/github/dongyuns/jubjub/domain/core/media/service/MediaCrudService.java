package io.github.dongyuns.jubjub.domain.core.media.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.core.account.entity.Account;
import io.github.dongyuns.jubjub.domain.core.account.repository.AccountRepository;
import io.github.dongyuns.jubjub.domain.core.media.entity.Media;
import io.github.dongyuns.jubjub.domain.core.media.repository.MediaRepository;
import io.github.dongyuns.jubjub.domain.core.member.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.core.member.repository.MemberProfileRepository;
import io.github.dongyuns.jubjub.domain.customer.profile.dto.ProfileImageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class MediaCrudService {

    private static final String PROFILE_OWNER_TYPE = "PROFILE";
    private static final String MENU_OWNER_TYPE = "MENU";

    private final AccountRepository accountRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final MediaRepository mediaRepository;

    /**
     * ==========================
     * PROFILE IMAGE
     * ==========================
     */

    @Transactional(readOnly = true)
    public ProfileImageResponse getMyProfileImage(String email) {

        MemberProfile profile = getMemberProfileByEmail(email);

        return mediaRepository
                .findFirstByOwnerTypeAndOwnerId(PROFILE_OWNER_TYPE, profile.getId())
                .map(media -> new ProfileImageResponse(
                        media.getMediaId(),
                        media.getImagePath()))
                .orElse(new ProfileImageResponse(null, null));
    }

    @Transactional
    public ProfileImageResponse createMyProfileImage(
            String email,
            String imagePath
    ) {

        MemberProfile profile = getMemberProfileByEmail(email);

        imagePath = validateImagePath(imagePath);

        if (mediaRepository.findFirstByOwnerTypeAndOwnerId(
                PROFILE_OWNER_TYPE,
                profile.getId()).isPresent()) {

            throw new BusinessException(
                    "PROFILE_IMAGE_ALREADY_EXISTS",
                    "프로필 사진이 이미 존재합니다.",
                    HttpStatus.CONFLICT
            );
        }

        Media saved = mediaRepository.save(
                Media.builder()
                        .ownerType(PROFILE_OWNER_TYPE)
                        .ownerId(profile.getId())
                        .imagePath(imagePath)
                        .build()
        );

        return new ProfileImageResponse(
                saved.getMediaId(),
                saved.getImagePath()
        );
    }

    @Transactional
    public ProfileImageResponse updateMyProfileImage(
            String email,
            String imagePath
    ) {

        MemberProfile profile = getMemberProfileByEmail(email);

        imagePath = validateImagePath(imagePath);

        Media media = getProfileMedia(profile.getId());

        media.setImagePath(imagePath);

        return new ProfileImageResponse(
                media.getMediaId(),
                media.getImagePath()
        );
    }

    @Transactional
    public void deleteMyProfileImage(String email) {

        MemberProfile profile = getMemberProfileByEmail(email);

        Media media = getProfileMedia(profile.getId());

        mediaRepository.delete(media);
    }

    /**
     * ==========================
     * MENU IMAGE
     * ==========================
     */

    @Transactional(readOnly = true)
    public String getMenuImage(Long menuId) {

        return mediaRepository
                .findFirstByOwnerTypeAndOwnerId(MENU_OWNER_TYPE, menuId)
                .map(Media::getImagePath)
                .orElse(null);
    }

    @Transactional
    public void createMenuImage(
            Long menuId,
            String imagePath
    ) {

        imagePath = validateImagePath(imagePath);

        if (mediaRepository.findFirstByOwnerTypeAndOwnerId(
                MENU_OWNER_TYPE,
                menuId).isPresent()) {

            throw new BusinessException(
                    "MENU_IMAGE_ALREADY_EXISTS",
                    "메뉴 이미지가 이미 존재합니다.",
                    HttpStatus.CONFLICT
            );
        }

        mediaRepository.save(
                Media.builder()
                        .ownerType(MENU_OWNER_TYPE)
                        .ownerId(menuId)
                        .imagePath(imagePath)
                        .build()
        );
    }

    @Transactional
    public void updateMenuImage(
            Long menuId,
            String imagePath
    ) {

        imagePath = validateImagePath(imagePath);

        Media media = getMenuMedia(menuId);

        media.setImagePath(imagePath);
    }

    /**
     * 메뉴 이미지 삭제
     * 이미지가 없으면 그냥 종료
     */
    @Transactional
    public void deleteMenuImage(Long menuId) {

        mediaRepository
                .findFirstByOwnerTypeAndOwnerId(MENU_OWNER_TYPE, menuId)
                .ifPresent(mediaRepository::delete);
    }

    /**
     * ==========================
     * COMMON
     * ==========================
     */

    private MemberProfile getMemberProfileByEmail(String email) {

        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() ->
                        new BusinessException(
                                "ACCOUNT_NOT_FOUND",
                                "가입되지 않은 사용자입니다.",
                                HttpStatus.NOT_FOUND));

        return memberProfileRepository.findByAccount(account)
                .orElseThrow(() ->
                        new BusinessException(
                                "PROFILE_NOT_FOUND",
                                "프로필 정보를 찾을 수 없습니다.",
                                HttpStatus.NOT_FOUND));
    }

    private Media getProfileMedia(Long profileId) {

        return mediaRepository
                .findFirstByOwnerTypeAndOwnerId(PROFILE_OWNER_TYPE, profileId)
                .orElseThrow(() ->
                        new BusinessException(
                                "PROFILE_IMAGE_NOT_FOUND",
                                "프로필 사진이 없습니다.",
                                HttpStatus.NOT_FOUND));
    }

    private Media getMenuMedia(Long menuId) {

        return mediaRepository
                .findFirstByOwnerTypeAndOwnerId(MENU_OWNER_TYPE, menuId)
                .orElseThrow(() ->
                        new BusinessException(
                                "MENU_IMAGE_NOT_FOUND",
                                "메뉴 이미지를 찾을 수 없습니다.",
                                HttpStatus.NOT_FOUND));
    }

    /**
     * 이미지 경로 검증
     */
    private String validateImagePath(String imagePath) {

        if (!StringUtils.hasText(imagePath)) {

            throw new BusinessException(
                    "INVALID_IMAGE_PATH",
                    "이미지 경로는 비어 있을 수 없습니다.",
                    HttpStatus.BAD_REQUEST
            );
        }

        return imagePath.trim();
    }
}