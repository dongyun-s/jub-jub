package io.github.dongyuns.jubjub.payment.domain;

public enum WebhookEventType {
    TRANSACTION_PAID("Transaction.Paid"),
    TRANSACTION_FAILED("Transaction.Failed"),
    TRANSACTION_CANCELLED("Transaction.Cancelled"),
    TRANSACTION_PARTIAL_CANCELLED("Transaction.PartialCancelled"),
    UNKNOWN("unknown");

    private final String code;

    WebhookEventType(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public static WebhookEventType from(String rawCode) {
        for (WebhookEventType value : values()) {
            if (value.code.equalsIgnoreCase(rawCode)) {
                return value;
            }
        }
        return UNKNOWN;
    }
}
