package io.github.dongyuns.jubjub.domain.media.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.auth.entity.Account;
import io.github.dongyuns.jubjub.domain.auth.repository.AccountRepository;
import io.github.dongyuns.jubjub.domain.media.dto.ProfileImageResponse;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.user.repository.MemberProfileRepository;
import io.github.dongyuns.jubjub.entity.Media;
import io.github.dongyuns.jubjub.repository.MediaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class MediaCrudService {

    private static final String PROFILE_OWNER_TYPE = "PROFILE";

    private final AccountRepository accountRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final MediaRepository mediaRepository;

    @Transactional(readOnly = true)
    public ProfileImageResponse getMyProfileImage(String email) {
        MemberProfile profile = getMemberProfileByEmail(email);

        return mediaRepository.findFirstByOwnerTypeAndOwnerId(PROFILE_OWNER_TYPE, profile.getId())
                .map(media -> new ProfileImageResponse(media.getMediaId(), media.getImagePath()))
                .orElse(new ProfileImageResponse(null, null));
    }

    @Transactional
    public ProfileImageResponse createMyProfileImage(String email, String imagePath) {
        MemberProfile profile = getMemberProfileByEmail(email);
        validateImagePath(imagePath);

        if (mediaRepository.findFirstByOwnerTypeAndOwnerId(PROFILE_OWNER_TYPE, profile.getId()).isPresent()) {
            throw new BusinessException("PROFILE_IMAGE_ALREADY_EXISTS", "프로필 사진이 이미 존재합니다.", HttpStatus.CONFLICT);
        }

        Media saved = mediaRepository.save(Media.builder()
                .ownerType(PROFILE_OWNER_TYPE)
                .ownerId(profile.getId())
                .imagePath(imagePath)
                .build());

        return new ProfileImageResponse(saved.getMediaId(), saved.getImagePath());
    }

    @Transactional
    public ProfileImageResponse updateMyProfileImage(String email, String imagePath) {
        MemberProfile profile = getMemberProfileByEmail(email);
        validateImagePath(imagePath);

        Media media = mediaRepository.findFirstByOwnerTypeAndOwnerId(PROFILE_OWNER_TYPE, profile.getId())
                .orElseThrow(() -> new BusinessException("PROFILE_IMAGE_NOT_FOUND", "프로필 사진이 없습니다.", HttpStatus.NOT_FOUND));

        media.setImagePath(imagePath);
        return new ProfileImageResponse(media.getMediaId(), media.getImagePath());
    }

    @Transactional
    public void deleteMyProfileImage(String email) {
        MemberProfile profile = getMemberProfileByEmail(email);

        Media media = mediaRepository.findFirstByOwnerTypeAndOwnerId(PROFILE_OWNER_TYPE, profile.getId())
                .orElseThrow(() -> new BusinessException("PROFILE_IMAGE_NOT_FOUND", "프로필 사진이 없습니다.", HttpStatus.NOT_FOUND));

        mediaRepository.delete(media);
    }

    private MemberProfile getMemberProfileByEmail(String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("ACCOUNT_NOT_FOUND", "가입되지 않은 사용자입니다.", HttpStatus.NOT_FOUND));

        return memberProfileRepository.findByAccount(account)
                .orElseThrow(() -> new BusinessException("PROFILE_NOT_FOUND", "프로필 정보를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
    }

    private void validateImagePath(String imagePath) {
        if (!StringUtils.hasText(imagePath)) {
            throw new BusinessException("INVALID_IMAGE_PATH", "이미지 경로는 비어 있을 수 없습니다.", HttpStatus.BAD_REQUEST);
        }
    }
}
