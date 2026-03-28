package io.github.dongyuns.jubjub.payment.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.payment.domain.Order;
import io.github.dongyuns.jubjub.payment.dto.CreateOrderRequest;
import io.github.dongyuns.jubjub.payment.dto.OrderResponse;
import io.github.dongyuns.jubjub.payment.repository.OrderRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import io.github.dongyuns.jubjub.user.domain.CustomerProfile;
import io.github.dongyuns.jubjub.user.domain.Store;
import io.github.dongyuns.jubjub.user.repository.CustomerProfileRepository;
import io.github.dongyuns.jubjub.user.repository.StoreRepository;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final StoreRepository storeRepository;

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        // 주문은 기존 고객/매장 데이터에 매달려 생성되므로 선행 데이터가 필요하다.
        CustomerProfile customerProfile = customerProfileRepository.findById(request.customerProfileId())
                .orElseThrow(() -> new BusinessException("CUSTOMER_PROFILE_NOT_FOUND", "고객 프로필을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        Store store = storeRepository.findById(request.storeId())
                .orElseThrow(() -> new BusinessException("STORE_NOT_FOUND", "매장을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        // 외부 PG와 직접 연결되지 않는 내부 주문번호를 따로 만들어 관리한다.
        String orderNo = "ORD-" + request.storeId() + "-" + LocalDateTime.now().toString().replace(":", "").replace(".", "");
        Order order = Order.ready(customerProfile, store, orderNo, request.totalAmount());
        return OrderResponse.from(orderRepository.save(order));
    }
}
