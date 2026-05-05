package io.github.dongyuns.jubjub.repository;

import io.github.dongyuns.jubjub.entity.Media;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MediaRepository extends JpaRepository<Media, Long> {

    List<Media> findByOwnerTypeAndOwnerId(String ownerType, Long ownerId);

    Optional<Media> findFirstByOwnerTypeAndOwnerId(String ownerType, Long ownerId);

    void deleteByOwnerTypeAndOwnerId(String ownerType, Long ownerId);
}
