import { RUNE_TIERS } from '../components/RuneIcon'

export interface RuneConfig {
  enabled: boolean
  tierName: string
  enhancement: number
}

export const DEFAULT_RUNE_CONFIG: RuneConfig = {
  enabled: false,
  tierName: 'Primal',
  enhancement: 0,
}

// Secondary bonus follows a "skip every 5" pattern, resetting at level 20.
// Confirmed for Primal (max +20) and Chaos (max +30). Assumed same for Abyssal.
export function getRuneSecondaryBonus(enhancement: number): number {
  if (enhancement <= 0) return 0
  if (enhancement <= 20) {
    return enhancement + Math.floor((enhancement - 1) / 5)
  }
  // Chaos tier only — phase 2 (levels 21–30)
  const sub = enhancement - 20
  return 23 + sub + Math.floor(sub / 5)
}

// Returns { primary, secondary } level buffs for a given rune config
export function getRuneLevelBonus(config: RuneConfig): { primary: number; secondary: number } {
  if (!config.enabled) return { primary: 0, secondary: 0 }
  const tier = RUNE_TIERS.find(t => t.name === config.tierName)
  if (!tier) return { primary: 0, secondary: 0 }
  return {
    primary: tier.bonus,
    secondary: getRuneSecondaryBonus(config.enhancement),
  }
}

// Effective special skill level with rune buff applied.
// Primary stat: rune bonus is added ON TOP of the natural cap (lv25).
//   e.g. lv35 pet + Primal (+15): effectivePrimary = min(35, 25) + 15 = 40
// Secondary stat: rune total (primary + secondary bonus) added to actual level.
//   e.g. lv35 + Primal +16 (+15 primary, +19 secondary): effectiveSecondary = 35 + 15 + 19 = 69
export function getEffectiveSkillLevel(
  actualLevel: number,
  config: RuneConfig,
): { effectivePrimary: number; effectiveSecondary: number } {
  const { primary, secondary } = getRuneLevelBonus(config)
  const effectivePrimary = Math.min(actualLevel, 25) + primary
  const effectiveSecondary = actualLevel + primary + secondary
  return { effectivePrimary, effectiveSecondary }
}
