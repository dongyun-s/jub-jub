package io.github.dongyuns.jubjub.domain.core.menu.repository;

import io.github.dongyuns.jubjub.domain.core.menu.entity.MenuOption;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MenuOptionRepository extends JpaRepository<MenuOption, Long> {
}