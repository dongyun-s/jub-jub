package io.github.dongyuns.jubjub.domain.ordertracking.service;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import net.nurigo.sdk.NurigoApp;
import net.nurigo.sdk.message.model.Message;
import net.nurigo.sdk.message.request.SingleMessageSendingRequest;
import net.nurigo.sdk.message.service.DefaultMessageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class OrderTrackingSmsService {

    private static final DateTimeFormatter PICKUP_TIME_FORMAT = DateTimeFormatter.ofPattern("M/d HH:mm");

    @Value("${coolsms.api.key}")
    private String apiKey;

    @Value("${coolsms.api.secret}")
    private String apiSecret;

    @Value("${coolsms.sender}")
    private String senderNumber;

    private DefaultMessageService messageService;

    @PostConstruct
    public void init() {
        this.messageService = NurigoApp.INSTANCE.initialize(apiKey, apiSecret, "https://api.coolsms.co.kr");
    }

    public void send(String to, String text) {
        if (to == null || to.isBlank()) {
            return;
        }

        Message message = new Message();
        message.setFrom(senderNumber);
        message.setTo(normalizePhone(to));
        message.setText(text);

        try {
            this.messageService.sendOne(new SingleMessageSendingRequest(message));
        } catch (Exception exception) {
            System.err.println("❌ 주문 상태 SMS 발송 실패: " + exception.getMessage());
        }
    }

    public String formatPickupTime(LocalDateTime estimatedPickupTime) {
        if (estimatedPickupTime == null) {
            return "";
        }
        return estimatedPickupTime.format(PICKUP_TIME_FORMAT);
    }

    private String normalizePhone(String phone) {
        return phone.replaceAll("[^0-9]", "");
    }
}
