package io.github.dongyuns.jubjub.settlement.controller;

import io.github.dongyuns.jubjub.settlement.dto.RunSettlementBatchRequest;
import io.github.dongyuns.jubjub.settlement.dto.RunSettlementBatchResponse;
import io.github.dongyuns.jubjub.settlement.service.SettlementBatchService;
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
        return settlementBatchService.run(request);
    }
}
