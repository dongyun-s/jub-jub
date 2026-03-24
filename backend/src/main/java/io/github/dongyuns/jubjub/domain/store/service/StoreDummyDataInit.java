package io.github.dongyuns.jubjub.domain.store.service;

import io.github.dongyuns.jubjub.domain.store.entity.Menu;
import io.github.dongyuns.jubjub.domain.store.entity.Store;
import io.github.dongyuns.jubjub.domain.store.repository.MenuRepository;
import io.github.dongyuns.jubjub.domain.store.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class StoreDummyDataInit implements ApplicationRunner {

    private final StoreRepository storeRepository;
    private final MenuRepository menuRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // 이미 데이터가 있다면 중복으로 넣지 않음
        if (storeRepository.count() > 0) {
            return;
        }

        // 1. UI 프로토타입에 있는 매장 생성
        Store store1 = Store.builder()
                .ownerProfileId(1L) // 임시 사장님 ID
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

        // 2. 해당 매장의 메뉴 생성 (프리미엄 줍줍 보울)
        Menu menu1 = Menu.builder()
                .store(store1)
                .name("프리미엄 줍줍 보울")
                .price(14900)
                .description("신선한 아보카도와 수비드 연어가 어우러진 줍줍의 시그니처 메뉴")
                .rewardXp(50)
                .isSoldOut(false)
                .build();

        // 3. 해당 매장의 메뉴 생성 (아보카도 가든 샐러드)
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
}