package io.github.dongyuns.jubjub.domain.reward.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class RewardTierConverter implements AttributeConverter<RewardTier, Integer> {

    @Override
    public Integer convertToDatabaseColumn(RewardTier attribute) {
        return attribute == null ? null : attribute.getCode();
    }

    @Override
    public RewardTier convertToEntityAttribute(Integer dbData) {
        return RewardTier.fromCode(dbData);
    }
}