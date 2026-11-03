package io.github.dongyuns.jubjub.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@MappedSuperclass // 상속받는 엔티티들이 아래 필드들을 컬럼으로 인식하게 함
@EntityListeners(AuditingEntityListener.class) // JPA Auditing 기능 활성화
public abstract class BaseTimeEntity {

    @CreatedDate // 엔티티 생성 시 시간이 자동 저장됨
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate // 엔티티 수정 시 시간이 자동 업데이트됨
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}