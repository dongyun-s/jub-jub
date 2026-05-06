/**
 * 리워드 등급(tier / tierName)에 따른 색상 팔레트 — 홈·마이 동일 사용
 */

export type TierKey = 'bronze' | 'silver' | 'gold' | 'diamond' | 'platinum' | 'legend' | 'default'

export function resolveTierKey(
  tier: string | null | undefined,
  tierName: string | null | undefined,
): TierKey {
  const raw = `${tier ?? ''} ${tierName ?? ''}`
  const lower = raw.toLowerCase().replace(/\s+/g, '')
  const upper = raw.toUpperCase()

  if (/bronze|브론즈/.test(lower) || upper.includes('BRONZE')) return 'bronze'
  if (/silver|실버/.test(lower) || upper.includes('SILVER')) return 'silver'
  if (/gold|골드/.test(lower) || upper.includes('GOLD')) return 'gold'
  if (/diamond|다이아/.test(lower) || upper.includes('DIAMOND')) return 'diamond'
  if (/legend|레전드/.test(lower) || upper.includes('LEGEND')) return 'legend'
  if (/platinum|플래티|master|마스터|vip/.test(lower) || /PLATINUM|MASTER|VIP/.test(upper)) return 'platinum'
  return 'default'
}

export interface TierTheme {
  gradeCardBackground: string
  gradeCardShadow: string
  badgeAccent: string
  progressFill: string
  progressGlow: string
  progressBorder: string
  myBadgeGradient: string
  myAvatarRing: string
  myAvatarGlow: string
  myAvatarIcon: string
  myTierProgress: string
  myTierProgressGlow: string
  myTierNameColor: string
  myGoalIcon: string
  myGoalBar: string
  myGoalBadgeColor: string
}

export const TIER_THEMES: Record<TierKey, TierTheme> = {
  default: {
    gradeCardBackground: 'linear-gradient(135deg, #f6319a 0%, #ec4899 52%, #db2777 100%)',
    gradeCardShadow: '0 10px 20px rgba(246, 49, 154, 0.4)',
    badgeAccent: '#67e8f9',
    progressFill: '#ffffff',
    progressGlow: '0 0 10px rgba(255, 255, 255, 0.85)',
    progressBorder: '1px solid rgba(255, 255, 255, 0.55)',
    myBadgeGradient: 'linear-gradient(to right, #f6319a, #ec4899)',
    myAvatarRing: 'rgba(246, 49, 154, 0.28)',
    myAvatarGlow: '0 10px 15px -3px rgba(246, 49, 154, 0.22)',
    myAvatarIcon: '#f6319a',
    myTierProgress: '#f6319a',
    myTierProgressGlow: '0 0 8px rgba(246, 49, 154, 0.5)',
    myTierNameColor: '#111827',
    myGoalIcon: '#f6319a',
    myGoalBar: '#f6319a',
    myGoalBadgeColor: '#f6319a',
  },
  bronze: {
    gradeCardBackground: 'linear-gradient(135deg, #78350f 0%, #b45309 48%, #92400e 100%)',
    gradeCardShadow: '0 10px 22px rgba(120, 53, 15, 0.48)',
    badgeAccent: '#fde68a',
    progressFill: '#fef3c7',
    progressGlow: '0 0 12px rgba(253, 230, 138, 0.65)',
    progressBorder: '1px solid rgba(254, 243, 199, 0.55)',
    myBadgeGradient: 'linear-gradient(to right, #92400e, #ea580c)',
    myAvatarRing: 'rgba(180, 83, 9, 0.4)',
    myAvatarGlow: '0 10px 18px -3px rgba(146, 64, 14, 0.35)',
    myAvatarIcon: '#c2410c',
    myTierProgress: '#ea580c',
    myTierProgressGlow: '0 0 10px rgba(234, 88, 12, 0.45)',
    myTierNameColor: '#78350f',
    myGoalIcon: '#c2410c',
    myGoalBar: '#ea580c',
    myGoalBadgeColor: '#c2410c',
  },
  silver: {
    gradeCardBackground: 'linear-gradient(135deg, #475569 0%, #94a3b8 42%, #64748b 100%)',
    gradeCardShadow: '0 10px 22px rgba(71, 85, 105, 0.42)',
    badgeAccent: '#f8fafc',
    progressFill: '#e2e8f0',
    progressGlow: '0 0 12px rgba(226, 232, 240, 0.75)',
    progressBorder: '1px solid rgba(248, 250, 252, 0.45)',
    myBadgeGradient: 'linear-gradient(to right, #64748b, #cbd5e1)',
    myAvatarRing: 'rgba(100, 116, 139, 0.45)',
    myAvatarGlow: '0 10px 18px -3px rgba(71, 85, 105, 0.28)',
    myAvatarIcon: '#64748b',
    myTierProgress: '#64748b',
    myTierProgressGlow: '0 0 9px rgba(100, 116, 139, 0.5)',
    myTierNameColor: '#334155',
    myGoalIcon: '#64748b',
    myGoalBar: '#94a3b8',
    myGoalBadgeColor: '#475569',
  },
  gold: {
    gradeCardBackground: 'linear-gradient(135deg, #a16207 0%, #eab308 45%, #ca8a04 100%)',
    gradeCardShadow: '0 10px 22px rgba(161, 98, 7, 0.42)',
    badgeAccent: '#fef9c3',
    progressFill: '#fde047',
    progressGlow: '0 0 14px rgba(253, 224, 71, 0.65)',
    progressBorder: '1px solid rgba(254, 249, 195, 0.5)',
    myBadgeGradient: 'linear-gradient(to right, #ca8a04, #facc15)',
    myAvatarRing: 'rgba(202, 138, 4, 0.45)',
    myAvatarGlow: '0 10px 18px -3px rgba(161, 98, 7, 0.32)',
    myAvatarIcon: '#ca8a04',
    myTierProgress: '#eab308',
    myTierProgressGlow: '0 0 10px rgba(234, 179, 8, 0.55)',
    myTierNameColor: '#713f12',
    myGoalIcon: '#ca8a04',
    myGoalBar: '#eab308',
    myGoalBadgeColor: '#a16207',
  },
  diamond: {
    gradeCardBackground: 'linear-gradient(135deg, #0369a1 0%, #38bdf8 48%, #0284c7 100%)',
    gradeCardShadow: '0 10px 22px rgba(3, 105, 161, 0.4)',
    badgeAccent: '#e0f2fe',
    progressFill: '#bae6fd',
    progressGlow: '0 0 14px rgba(186, 230, 253, 0.75)',
    progressBorder: '1px solid rgba(224, 242, 254, 0.55)',
    myBadgeGradient: 'linear-gradient(to right, #0284c7, #38bdf8)',
    myAvatarRing: 'rgba(14, 165, 233, 0.45)',
    myAvatarGlow: '0 10px 18px -3px rgba(3, 105, 161, 0.3)',
    myAvatarIcon: '#0284c7',
    myTierProgress: '#0ea5e9',
    myTierProgressGlow: '0 0 10px rgba(14, 165, 233, 0.55)',
    myTierNameColor: '#0c4a6e',
    myGoalIcon: '#0284c7',
    myGoalBar: '#38bdf8',
    myGoalBadgeColor: '#0369a1',
  },
  platinum: {
    gradeCardBackground: 'linear-gradient(135deg, #5b21b6 0%, #a855f7 50%, #7e22ce 100%)',
    gradeCardShadow: '0 10px 22px rgba(91, 33, 182, 0.45)',
    badgeAccent: '#f3e8ff',
    progressFill: '#ddd6fe',
    progressGlow: '0 0 14px rgba(221, 214, 254, 0.65)',
    progressBorder: '1px solid rgba(243, 232, 255, 0.45)',
    myBadgeGradient: 'linear-gradient(to right, #7c3aed, #c084fc)',
    myAvatarRing: 'rgba(168, 85, 247, 0.45)',
    myAvatarGlow: '0 10px 18px -3px rgba(91, 33, 182, 0.32)',
    myAvatarIcon: '#9333ea',
    myTierProgress: '#a855f7',
    myTierProgressGlow: '0 0 10px rgba(168, 85, 247, 0.55)',
    myTierNameColor: '#581c87',
    myGoalIcon: '#9333ea',
    myGoalBar: '#c084fc',
    myGoalBadgeColor: '#7c3aed',
  },
  legend: {
    // 레전드는 “기본 이미지” 느낌을 피하려고 네온/오로라 계열로 강하게
    gradeCardBackground:
      'linear-gradient(135deg, #0ea5e9 0%, #a78bfa 28%, #f472b6 58%, #f59e0b 100%)',
    gradeCardShadow: '0 14px 30px rgba(15, 23, 42, 0.35)',
    badgeAccent: '#ffffff',
    progressFill: 'rgba(255, 255, 255, 0.92)',
    progressGlow: '0 0 18px rgba(255, 255, 255, 0.75)',
    progressBorder: '1px solid rgba(255, 255, 255, 0.45)',
    myBadgeGradient: 'linear-gradient(to right, #06b6d4, #a78bfa, #f472b6)',
    myAvatarRing: 'rgba(167, 139, 250, 0.5)',
    myAvatarGlow: '0 12px 20px -4px rgba(167, 139, 250, 0.35)',
    myAvatarIcon: '#7c3aed',
    myTierProgress: '#7c3aed',
    myTierProgressGlow: '0 0 12px rgba(124, 58, 237, 0.45)',
    myTierNameColor: '#3b0764',
    myGoalIcon: '#7c3aed',
    myGoalBar: '#7c3aed',
    myGoalBadgeColor: '#7c3aed',
  },
}

export function getTierTheme(
  tier: string | null | undefined,
  tierName: string | null | undefined,
): TierTheme {
  return TIER_THEMES[resolveTierKey(tier, tierName)]
}

/** UI 표기용 영문 등급 라벨 (tierName 대신 사용) */
export function getTierLabelEn(
  tier: string | null | undefined,
  tierName: string | null | undefined,
): string {
  const rawTier = (tier ?? '').trim()
  if (rawTier) return rawTier.toUpperCase()

  // tierName만 오는 경우에도 영문 라벨로 통일
  const key = resolveTierKey(tier, tierName)
  if (key === 'bronze') return 'BRONZE'
  if (key === 'silver') return 'SILVER'
  if (key === 'gold') return 'GOLD'
  if (key === 'diamond') return 'DIAMOND'
  if (key === 'platinum') return 'PLATINUM'
  if (key === 'legend') return 'LEGEND'
  return 'TIER'
}
