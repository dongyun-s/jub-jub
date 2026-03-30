package io.github.dongyuns.jubjub.domain.store.repository;

import io.github.dongyuns.jubjub.domain.store.entity.MenuOption;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MenuOptionRepository extends JpaRepository<MenuOption, Long> {
}