package io.github.dongyuns.jubjub.domain.reward.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class RewardTierConverter implements AttributeConverter<RewardTier, Integer> {

    @Override
    public Integer convertToDatabaseColumn(RewardTier attribute) {
        if (attribute == null) {
            return 1;
        }
        return attribute.ordinal() + 1;
    }

    @Override
    public RewardTier convertToEntityAttribute(Integer dbData) {
        if (dbData == null || dbData == 0) {
            return RewardTier.BRONZE;
        }

        RewardTier[] tiers = RewardTier.values();
        if (dbData >= 1 && dbData <= tiers.length) {
            return tiers[dbData - 1];
        }

        throw new IllegalArgumentException("지원하지 않는 RewardTier 값입니다: " + dbData);
    }
}
