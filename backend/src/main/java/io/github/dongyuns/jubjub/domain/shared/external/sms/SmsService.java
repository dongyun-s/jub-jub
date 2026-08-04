package io.github.dongyuns.jubjub.domain.shared.external.sms;

import jakarta.annotation.PostConstruct;
import net.nurigo.sdk.NurigoApp;
import net.nurigo.sdk.message.model.Message;
import net.nurigo.sdk.message.request.SingleMessageSendingRequest;
import net.nurigo.sdk.message.service.DefaultMessageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SmsService {

    @Value("${coolsms.api.key}")
    private String apiKey;

    @Value("${coolsms.api.secret}")
    private String apiSecret;

    @Value("${coolsms.sender}")
    private String senderNumber;

    private DefaultMessageService messageService;

    @PostConstruct
    public void init() {
        // 🔍 이 두 줄을 추가해서 콘솔 창에 찍히는 글자 수를 보세요!
        System.out.println("DEBUG: API Key 길이 = " + (apiKey != null ? apiKey.length() : "NULL"));
        System.out.println("DEBUG: API Secret 길이 = " + (apiSecret != null ? apiSecret.length() : "NULL"));
        // 서비스 초기화 (API Key와 Secret을 사용하여 메세지 서비스 생성)
        this.messageService = NurigoApp.INSTANCE.initialize(apiKey, apiSecret, "https://api.coolsms.co.kr");
    }

    /**
     * 실제 SMS 발송 로직
     */
    public void sendVerificationSms(String to, String code) {
        Message message = new Message();
        message.setFrom(senderNumber); // 설정한 발신번호
        message.setTo(to);             // 받는 사람 번호
        message.setText("[줍줍] 본인인증 번호는 [" + code + "] 입니다. 5분 내에 입력해주세요.");

        try {
            this.messageService.sendOne(new SingleMessageSendingRequest(message));
            System.out.println("✅ SMS 발송 성공! 대상: " + to + ", 번호: " + code);
        } catch (Exception e) {
            System.err.println("❌ SMS 발송 실패: " + e.getMessage());
        }
    }
}