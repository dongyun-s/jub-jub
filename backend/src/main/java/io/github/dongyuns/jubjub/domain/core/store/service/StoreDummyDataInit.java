package io.github.dongyuns.jubjub.domain.core.store.service;

import io.github.dongyuns.jubjub.domain.core.menu.entity.Menu;
import io.github.dongyuns.jubjub.domain.core.menu.entity.MenuOption;
import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.core.menu.repository.MenuOptionRepository;
import io.github.dongyuns.jubjub.domain.core.menu.repository.MenuRepository;
import io.github.dongyuns.jubjub.domain.core.store.repository.StoreRepository;
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

        // 🌟 보호막(if문) 가동! DB에 가게 데이터가 아예 없을 때(0개)만 더미 데이터를 넣습니다.
        if (storeRepository.count() == 0) {

            // ==========================================
            // 1. 샐러드 정글 강남점 세팅
            // ==========================================
            Store store1 = Store.builder()
                    .ownerProfileId(1L) // 가상의 사장님 프로필 ID
                    .categoryId(1) // 1번: 샐러드 카테고리
                    .name("샐러드 정글 강남점")
                    .address("서울시 강남구 역삼동")
                    .phoneNumber("02-1234-5678")
                    .originInfo("연어: 노르웨이산, 소고기: 호주산, 야채: 국내산")
                    .latitude(37.498095)
                    .longitude(127.027610)
                    .cookingTimeMinutes(25)
                    .minOrderAmount(12000)
                    .status("OPEN")
                    .build();
            storeRepository.save(store1);

            Menu menu1 = Menu.builder().store(store1).name("프리미엄 줍줍 보울").price(14900).description("신선한 아보카도와 수비드 연어가 어우러진 줍줍의 시그니처 메뉴").rewardXp(50).isSoldOut(false).build();
            Menu menu2 = Menu.builder().store(store1).name("아보카도 가든 샐러드").price(12500).description("숲의 버터 아보카도와 유기농 채소의 환상적인 만남").rewardXp(30).isSoldOut(false).build();
            menuRepository.saveAll(List.of(menu1, menu2));

            // ==========================================
            // 2. 네온 더블 치즈버거 세팅
            // ==========================================
            Store store2 = Store.builder()
                    .ownerProfileId(2L)
                    .categoryId(2)
                    .name("네온 더블 치즈버거 본점")
                    .address("서울시 강남구 논현동")
                    .phoneNumber("02-9876-5432")
                    .originInfo("소고기 패티: 미국산 100%, 베이컨: 스페인산")
                    .latitude(37.511111)
                    .longitude(127.033333)
                    .cookingTimeMinutes(15)
                    .minOrderAmount(9000)
                    .status("OPEN")
                    .build();
            storeRepository.save(store2);

            Menu burgerMenu = Menu.builder().store(store2).name("네온 더블 치즈버거").price(8900).description("두 배의 치즈와 육즙 가득한 패티가 만난 줍줍의 시그니처 버거.").rewardXp(40).isSoldOut(false).build();
            menuRepository.save(burgerMenu);

            MenuOption opt1 = MenuOption.builder().menu(burgerMenu).name("치즈 추가 (Extra Cheese)").additionalPrice(1000).isRequired(false).build();
            MenuOption opt2 = MenuOption.builder().menu(burgerMenu).name("베이컨 추가 (Bacon)").additionalPrice(1500).isRequired(false).build();
            MenuOption opt3 = MenuOption.builder().menu(burgerMenu).name("구운 양파 추가 (Grilled Onion)").additionalPrice(500).isRequired(false).build();
            MenuOption opt4 = MenuOption.builder().menu(burgerMenu).name("패티 추가 (Extra Patty)").additionalPrice(3500).isRequired(false).build();

            menuOptionRepository.saveAll(List.of(opt1, opt2, opt3, opt4));

            System.out.println("✅ 최초 1회 더미 데이터 세팅 완벽 성공!");
        } else {
            // 🌟 가게 데이터가 이미 존재하면 추가하지 않고 건너뜁니다! (ID 증식 방지)
            System.out.println("✅ 이미 더미 데이터가 존재하므로 세팅을 건너뜁니다! (기존 데이터 완벽 보존 😎)");
        }
    }
}