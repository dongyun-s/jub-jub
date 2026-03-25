package io.github.dongyuns.jubjub.domain.store.service;

import io.github.dongyuns.jubjub.domain.store.entity.Menu;
import io.github.dongyuns.jubjub.domain.store.entity.MenuOption;
import io.github.dongyuns.jubjub.domain.store.entity.Store;
import io.github.dongyuns.jubjub.domain.store.repository.MenuOptionRepository;
import io.github.dongyuns.jubjub.domain.store.repository.MenuRepository;
import io.github.dongyuns.jubjub.domain.store.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class StoreDummyDataInit implements ApplicationRunner {

    private final StoreRepository storeRepository;
    private final MenuRepository menuRepository;
    private final MenuOptionRepository menuOptionRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {

        // ==========================================
        // 1. 샐러드 정글 강남점 세팅 (데이터가 0개일 때만)
        // ==========================================
        if (storeRepository.count() == 0) {
            Store store1 = Store.builder()
                    .ownerProfileId(1L)
                    .name("샐러드 정글 강남점")
                    .category("샐러드")
                    .address("서울시 강남구 역삼동")
                    .latitude(37.498095)
                    .longitude(127.027610)
                    .cookingTimeMinutes(25)
                    .minOrderAmount(12000)
                    .status("OPEN")
                    .build();
            storeRepository.save(store1);

            Menu menu1 = Menu.builder()
                    .store(store1)
                    .name("프리미엄 줍줍 보울")
                    .price(14900)
                    .description("신선한 아보카도와 수비드 연어가 어우러진 줍줍의 시그니처 메뉴")
                    .rewardXp(50)
                    .isSoldOut(false)
                    .build();

            Menu menu2 = Menu.builder()
                    .store(store1)
                    .name("아보카도 가든 샐러드")
                    .price(12500)
                    .description("숲의 버터 아보카도와 유기농 채소의 환상적인 만남")
                    .rewardXp(30)
                    .isSoldOut(false)
                    .build();
            menuRepository.save(menu1);
            menuRepository.save(menu2);
            System.out.println("✅ 초기 더미 데이터 세팅 완료: 샐러드 정글 강남점");
        }

        // ==========================================
        // 2. 네온 더블 치즈버거 세팅 (해당 이름이 없을 때만)
        // ==========================================
        boolean hasBurgerStore = storeRepository.findAll().stream().anyMatch(store -> store.getName().contains("네온"));

        if (!hasBurgerStore) {
            Store store2 = Store.builder()
                    .ownerProfileId(2L)
                    .name("네온 더블 치즈버거 본점")
                    .category("패스트푸드")
                    .address("서울시 강남구 논현동")
                    .latitude(37.511111)
                    .longitude(127.033333)
                    .cookingTimeMinutes(15)
                    .minOrderAmount(9000)
                    .status("OPEN")
                    .build();
            storeRepository.save(store2);

            Menu burgerMenu = Menu.builder()
                    .store(store2)
                    .name("네온 더블 치즈버거")
                    .price(8900)
                    .description("두 배의 치즈와 육즙 가득한 패티가 만난 줍줍의 시그니처 버거.")
                    .rewardXp(40)
                    .isSoldOut(false)
                    .build();
            menuRepository.save(burgerMenu);

            MenuOption opt1 = MenuOption.builder().menu(burgerMenu).name("치즈 추가 (Extra Cheese)").additionalPrice(1000).isRequired(false).build();
            MenuOption opt2 = MenuOption.builder().menu(burgerMenu).name("베이컨 추가 (Bacon)").additionalPrice(1500).isRequired(false).build();
            MenuOption opt3 = MenuOption.builder().menu(burgerMenu).name("구운 양파 추가 (Grilled Onion)").additionalPrice(500).isRequired(false).build();
            MenuOption opt4 = MenuOption.builder().menu(burgerMenu).name("패티 추가 (Extra Patty)").additionalPrice(3500).isRequired(false).build();

            menuOptionRepository.saveAll(List.of(opt1, opt2, opt3, opt4));
            System.out.println("✅ 추가 더미 데이터 세팅 완료: 네온 더블 치즈버거 및 옵션 4종");
        }
    }
}