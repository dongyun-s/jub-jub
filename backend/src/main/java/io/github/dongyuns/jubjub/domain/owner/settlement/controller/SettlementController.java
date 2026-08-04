package io.github.dongyuns.jubjub.domain.owner.settlement.controller;

import io.github.dongyuns.jubjub.domain.owner.settlement.dto.RunSettlementBatchRequest;
import io.github.dongyuns.jubjub.domain.owner.settlement.dto.RunSettlementBatchResponse;
import io.github.dongyuns.jubjub.domain.core.settlement.service.SettlementBatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/settlements")
@RequiredArgsConstructor
public class SettlementController {

    private final SettlementBatchService settlementBatchService;

    @PostMapping("/batch")
    public RunSettlementBatchResponse runBatch(@Valid @RequestBody RunSettlementBatchRequest request) {
        // 기간별 결제/환불 내역을 모아 매장 정산서를 생성한다.
        return settlementBatchService.run(request);
    }
}
