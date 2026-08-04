package io.github.dongyuns.jubjub.domain.owner.review.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import io.github.dongyuns.jubjub.domain.core.account.entity.Account;
import io.github.dongyuns.jubjub.domain.core.account.entity.AccountRole;
import io.github.dongyuns.jubjub.domain.core.account.repository.AccountRepository;
import io.github.dongyuns.jubjub.domain.core.media.entity.Media;
import io.github.dongyuns.jubjub.domain.core.media.repository.MediaRepository;
import io.github.dongyuns.jubjub.domain.core.member.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.core.member.repository.MemberProfileRepository;
import io.github.dongyuns.jubjub.domain.core.review.entity.Review;
import io.github.dongyuns.jubjub.domain.core.review.entity.ReviewReply;
import io.github.dongyuns.jubjub.domain.core.review.repository.ReviewReplyRepository;
import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.core.store.repository.StoreRepository;
import io.github.dongyuns.jubjub.domain.owner.review.dto.OwnerReviewListResponse;
import io.github.dongyuns.jubjub.domain.owner.review.dto.OwnerReviewSummaryResponse;
import io.github.dongyuns.jubjub.domain.owner.review.dto.ReviewReplyRequest;
import io.github.dongyuns.jubjub.domain.owner.review.dto.ReviewReplyResponse;
import io.github.dongyuns.jubjub.domain.owner.review.repository.OwnerReviewQueryRepository;
import io.github.dongyuns.jubjub.domain.owner.review.repository.OwnerReviewQueryRepository.ReviewFilter;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class OwnerReviewServiceTest {

    @Mock private AccountRepository accountRepository;
    @Mock private MemberProfileRepository memberProfileRepository;
    @Mock private StoreRepository storeRepository;
    @Mock private MediaRepository mediaRepository;
    @Mock private ReviewReplyRepository reviewReplyRepository;
    @Mock private OwnerReviewQueryRepository ownerReviewQueryRepository;
    @Mock private ReviewInsightService reviewInsightService;

    private OwnerReviewService ownerReviewService;

    @BeforeEach
    void setUp() {
        ownerReviewService = new OwnerReviewService(
                accountRepository,
                memberProfileRepository,
                storeRepository,
                mediaRepository,
                reviewReplyRepository,
                ownerReviewQueryRepository,
                reviewInsightService
        );
    }

    @Test
    void returnsOnlyReviewsQueriedForAuthenticatedOwnersStore() {
        OwnerFixture fixture = stubOwner();
        Review review = review(10L, fixture.store().getId(), fixture.customer().getId(), 5);
        Media media = Media.builder().ownerType("REVIEW").ownerId(10L).imagePath("review/10.jpg").build();

        when(ownerReviewQueryRepository.findReviews(20L, ReviewFilter.ALL, "맛있어요"))
                .thenReturn(List.of(review));
        when(memberProfileRepository.findAllById(any())).thenReturn(List.of(fixture.customer()));
        when(mediaRepository.findByOwnerTypeAndOwnerIdIn(eq("REVIEW"), anyList())).thenReturn(List.of(media));
        when(reviewReplyRepository.findByReviewReviewIdIn(anyList())).thenReturn(List.of());

        OwnerReviewListResponse response = ownerReviewService.getReviews(
                "owner@jubjub.com", ReviewFilter.ALL, "맛있어요"
        );

        assertThat(response.count()).isEqualTo(1);
        assertThat(response.reviews().getFirst().reviewerName()).isEqualTo("고객닉네임");
        assertThat(response.reviews().getFirst().imagePaths()).containsExactly("review/10.jpg");
        assertThat(response.reviews().getFirst().answered()).isFalse();
        verify(ownerReviewQueryRepository).findReviews(20L, ReviewFilter.ALL, "맛있어요");
    }

    @Test
    void calculatesRatingAndAnswerSummary() {
        OwnerFixture fixture = stubOwner();
        Review fiveStar = review(10L, 20L, fixture.customer().getId(), 5);
        Review threeStar = review(11L, 20L, fixture.customer().getId(), 3);
        ReviewReply reply = reply(30L, fiveStar, "감사합니다.");
        Media photo = Media.builder().ownerType("REVIEW").ownerId(11L).imagePath("review/11.jpg").build();

        when(ownerReviewQueryRepository.findReviews(20L, ReviewFilter.ALL, null))
                .thenReturn(List.of(fiveStar, threeStar));
        when(memberProfileRepository.findAllById(any())).thenReturn(List.of(fixture.customer()));
        when(mediaRepository.findByOwnerTypeAndOwnerIdIn(eq("REVIEW"), anyList())).thenReturn(List.of(photo));
        when(reviewReplyRepository.findByReviewReviewIdIn(anyList())).thenReturn(List.of(reply));

        OwnerReviewSummaryResponse response = ownerReviewService.getSummary("owner@jubjub.com");

        assertThat(response.averageRating()).isEqualTo(4.0);
        assertThat(response.totalReviewCount()).isEqualTo(2);
        assertThat(response.unansweredReviewCount()).isEqualTo(1);
        assertThat(response.photoReviewCount()).isEqualTo(1);
        assertThat(response.ratingDistribution().fiveStar()).isEqualTo(1);
        assertThat(response.ratingDistribution().threeStar()).isEqualTo(1);
    }

    @Test
    void createsReplyOnlyForReviewOwnedByOwnersStore() {
        stubOwner();
        Review review = review(10L, 20L, 101L, 5);
        when(ownerReviewQueryRepository.findReview(20L, 10L)).thenReturn(Optional.of(review));
        when(reviewReplyRepository.findByReviewReviewId(10L)).thenReturn(Optional.empty());
        when(reviewReplyRepository.saveAndFlush(any(ReviewReply.class))).thenAnswer(invocation -> {
            ReviewReply saved = invocation.getArgument(0);
            setField(saved, "id", 30L);
            invoke(saved, "onCreate");
            return saved;
        });

        ReviewReplyResponse response = ownerReviewService.createReply(
                "owner@jubjub.com", 10L, new ReviewReplyRequest(" 감사합니다. ")
        );

        assertThat(response.replyId()).isEqualTo(30L);
        assertThat(response.reviewId()).isEqualTo(10L);
        assertThat(response.content()).isEqualTo("감사합니다.");
    }

    @Test
    void deletesReplyOnlyForReviewOwnedByOwnersStore() {
        stubOwner();
        Review review = review(10L, 20L, 101L, 5);
        ReviewReply reply = reply(30L, review, "감사합니다.");
        when(ownerReviewQueryRepository.findReview(20L, 10L)).thenReturn(Optional.of(review));
        when(reviewReplyRepository.findByReviewReviewId(10L)).thenReturn(Optional.of(reply));

        ownerReviewService.deleteReply("owner@jubjub.com", 10L);

        verify(reviewReplyRepository).delete(reply);
    }

    @Test
    void rejectsDeletingMissingReply() {
        stubOwner();
        Review review = review(10L, 20L, 101L, 5);
        when(ownerReviewQueryRepository.findReview(20L, 10L)).thenReturn(Optional.of(review));
        when(reviewReplyRepository.findByReviewReviewId(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ownerReviewService.deleteReply("owner@jubjub.com", 10L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("삭제할 답글이 없습니다.");

        verify(reviewReplyRepository, never()).delete(any());
    }

    @Test
    void rejectsReviewFromAnotherStore() {
        stubOwner();
        when(ownerReviewQueryRepository.findReview(20L, 999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ownerReviewService.createReply(
                "owner@jubjub.com", 999L, new ReviewReplyRequest("답글")
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("해당 매장의 리뷰를 찾을 수 없습니다.");

        verify(reviewReplyRepository, never()).saveAndFlush(any());
    }

    @Test
    void rejectsNonOwnerAccount() {
        Account user = Account.builder()
                .email("user@jubjub.com")
                .password("password")
                .role(AccountRole.USER)
                .build();
        when(accountRepository.findByEmail("user@jubjub.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> ownerReviewService.getSummary("user@jubjub.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("사장님 계정만 접근할 수 있습니다.");
    }

    private OwnerFixture stubOwner() {
        Account owner = Account.builder()
                .email("owner@jubjub.com")
                .password("password")
                .role(AccountRole.OWNER)
                .build();
        MemberProfile ownerProfile = profile(1L, owner, "사장님", "사장님");
        MemberProfile customer = profile(101L, Account.builder()
                .email("customer@jubjub.com")
                .password("password")
                .role(AccountRole.USER)
                .build(), "고객", "고객닉네임");
        Store store = Store.builder()
                .ownerProfileId(1L)
                .name("줍줍 매장")
                .address("서울")
                .phoneNumber("0212345678")
                .build();
        setField(store, "id", 20L);

        when(accountRepository.findByEmail("owner@jubjub.com")).thenReturn(Optional.of(owner));
        when(memberProfileRepository.findByAccount(owner)).thenReturn(Optional.of(ownerProfile));
        when(storeRepository.findByOwnerProfileId(1L)).thenReturn(Optional.of(store));
        return new OwnerFixture(customer, store);
    }

    private MemberProfile profile(Long id, Account account, String name, String nickname) {
        MemberProfile profile = MemberProfile.builder()
                .account(account)
                .name(name)
                .phone("010" + String.format("%08d", id))
                .nickname(nickname)
                .build();
        setField(profile, "id", id);
        return profile;
    }

    private Review review(Long id, Long storeId, Long memberId, int rating) {
        return Review.builder()
                .reviewId(id)
                .orderId(id + 1000)
                .memberProfileId(memberId)
                .storeId(storeId)
                .overallRating(rating)
                .tasteRating(rating)
                .packagingRating(rating)
                .timeRating(rating)
                .content("맛있어요")
                .createdAt(LocalDateTime.now())
                .build();
    }

    private ReviewReply reply(Long id, Review review, String content) {
        ReviewReply reply = ReviewReply.create(review, content);
        setField(reply, "id", id);
        invoke(reply, "onCreate");
        return reply;
    }

    private void setField(Object target, String fieldName, Object value) {
        try {
            Field field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException exception) {
            throw new IllegalStateException(fieldName + " 필드 설정에 실패했습니다.", exception);
        }
    }

    private void invoke(Object target, String methodName) {
        try {
            Method method = target.getClass().getDeclaredMethod(methodName);
            method.setAccessible(true);
            method.invoke(target);
        } catch (ReflectiveOperationException exception) {
            throw new IllegalStateException(methodName + " 호출에 실패했습니다.", exception);
        }
    }

    private record OwnerFixture(MemberProfile customer, Store store) {
    }
}
