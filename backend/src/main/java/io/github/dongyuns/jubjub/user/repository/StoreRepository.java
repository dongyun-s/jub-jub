package io.github.dongyuns.jubjub.user.repository;

import io.github.dongyuns.jubjub.user.domain.Store;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreRepository extends JpaRepository<Store, Long> {

    List<Store> findAllByOwnerProfileId(Long ownerProfileId);
}
