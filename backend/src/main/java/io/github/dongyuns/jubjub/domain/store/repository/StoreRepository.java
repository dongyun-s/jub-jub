package io.github.dongyuns.jubjub.domain.store.repository;

import io.github.dongyuns.jubjub.domain.store.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StoreRepository extends JpaRepository<Store, Long> {
    List<Store> findByCategoryIdOrderByIdAsc(Integer categoryId);

    List<Store> findByLatitudeBetweenAndLongitudeBetween(
            Double minLatitude,
            Double maxLatitude,
            Double minLongitude,
            Double maxLongitude
    );

    List<Store> findByCategoryIdAndLatitudeBetweenAndLongitudeBetween(
            Integer categoryId,
            Double minLatitude,
            Double maxLatitude,
            Double minLongitude,
            Double maxLongitude
    );
}
