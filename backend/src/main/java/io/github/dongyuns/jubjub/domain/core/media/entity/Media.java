package io.github.dongyuns.jubjub.domain.core.media.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "media", indexes = {
        @Index(name = "idx_media_owner_type_owner_id", columnList = "owner_type, owner_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Media {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "media_id")
    private Long mediaId;

    @Column(name = "owner_type")
    private String ownerType;

    @Column(name = "owner_id")
    private Long ownerId;

    @Column(name = "image_path")
    private String imagePath;

}
