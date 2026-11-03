package io.github.dongyuns.jubjub.domain.shared.external.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender javaMailSender; // 🌟 우리가 설정한 구글 SMTP를 사용하는 스프링의 우체부 객체

    public void sendVerificationEmail(String toEmail, String authCode) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail); // 받는 사람
            helper.setSubject("[JubJub] 이메일 인증 번호 안내"); // 메일 제목

            // 🌟 예쁜 HTML 형식으로 메일 내용 작성
            String htmlContent = """
                    <div style='margin:20px; border:1px solid #ccc; padding:20px; border-radius:10px; font-family:sans-serif;'>
                        <h2 style='color:#FF7A00;'>JubJub 서비스에 오신 것을 환영합니다! 🎉</h2>
                        <p>아래 6자리 인증 번호를 진행 중인 화면에 입력해 주세요.</p>
                        <div style='background-color:#f8f9fa; padding:15px; text-align:center; font-size:24px; font-weight:bold; letter-spacing:5px; border-radius:5px;'>
                            %s
                        </div>
                        <p style='color:#888; font-size:12px; margin-top:20px;'>* 본 인증번호는 5분간 유효합니다.</p>
                    </div>
                    """.formatted(authCode);

            helper.setText(htmlContent, true); // true를 줘야 HTML로 인식함

            // 메일 발송!
            javaMailSender.send(message);
            log.info("✅ 이메일 발송 성공! 대상: {}", toEmail);

        } catch (MessagingException e) {
            log.error("❌ 이메일 발송 실패! 대상: {}", toEmail, e);
            throw new RuntimeException("이메일 발송 중 서버 오류가 발생했습니다.");
        }
    }
}