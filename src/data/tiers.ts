export interface TierConfig {
  label: string
  special: number
  regular: number
  maxSkillLv: number
  cooldown: string
}

export const TIER_CONFIG: Record<string, TierConfig> = {
  T1:   { label: 'Tier 1',      special: 0, regular: 1, maxSkillLv: 10, cooldown: '1m 38s' },
  T2:   { label: 'Tier 2',      special: 0, regular: 2, maxSkillLv: 10, cooldown: '1m 33s' },
  T3:   { label: 'Tier 3',      special: 0, regular: 3, maxSkillLv: 10, cooldown: '1m 28s' },
  T4:   { label: 'Tier 4',      special: 0, regular: 4, maxSkillLv: 10, cooldown: '1m 23s' },
  T5:   { label: 'Tier 5',      special: 1, regular: 4, maxSkillLv: 10, cooldown: '1m 18s' },
  T6:   { label: 'Tier 6',      special: 1, regular: 4, maxSkillLv: 15, cooldown: '1m 13s' },
  T6S:  { label: 'Tier 6 ✦',   special: 1, regular: 4, maxSkillLv: 20, cooldown: '1m 8s'  },
  T7:   { label: 'Tier 7',      special: 1, regular: 4, maxSkillLv: 25, cooldown: '1m 7s'  },
  T7S:  { label: 'Tier 7 ✦',  special: 1, regular: 4, maxSkillLv: 30, cooldown: '1m 6s'  },
  T7SS: { label: 'Tier 7 ✦✦', special: 1, regular: 4, maxSkillLv: 35, cooldown: '1m 5s'  },
}

export const TIERS = Object.keys(TIER_CONFIG)

// Legacy shim used by Builder/Recommendations pages
export const TIER_SLOTS: Record<string, { special: number; regular: number }> = Object.fromEntries(
  Object.entries(TIER_CONFIG).map(([k, v]) => [k, { special: v.special, regular: v.regular }])
)
