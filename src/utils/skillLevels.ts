// Skill value range formulas — derived from the official Skill Level reference table (Lv1–Lv25).
// Special skills: value increments are capped at Lv25 (higher levels yield the same range).
// Regular skills: no cap — formula scales continuously to Lv35.

export type SkillUnit = 'flat' | 'percent' | 'lt'

interface SkillFormula {
  minFn: (lv: number) => number
  maxFn: (lv: number) => number
  unit: SkillUnit
  capLv?: number  // if set, clamp level to this before applying formula
}

const r = (v: number) => Math.round(v * 100) / 100

const FORMULAS: Record<string, SkillFormula> = {
  // Special skills — value capped at Lv25
  sp_ap:          { minFn: lv => 10 + lv,               maxFn: lv => 20 + lv,               unit: 'flat',    capLv: 25 },
  sp_dp:          { minFn: lv => 10 + lv,               maxFn: lv => 20 + lv,               unit: 'flat',    capLv: 25 },
  sp_max_hp:      { minFn: lv => 100 + lv * 10,         maxFn: lv => 200 + lv * 10,         unit: 'flat',    capLv: 25 },
  sp_boss_dmg:    { minFn: lv => r(5.67 + 0.33 * lv),  maxFn: lv => r(11.67 + 0.33 * lv), unit: 'percent', capLv: 25 },
  sp_crit_dmg:    { minFn: lv => 10 + lv,               maxFn: lv => 20 + lv,               unit: 'percent', capLv: 25 },
  sp_crit_rate:   { minFn: lv => r(1.89 + 0.11 * lv),  maxFn: lv => r(3.89 + 0.11 * lv),  unit: 'percent', capLv: 25 },
  sp_branch_dmg:  { minFn: lv => r(0.89 + 0.11 * lv),  maxFn: lv => r(3.89 + 0.11 * lv),  unit: 'percent', capLv: 25 },
  // Secondary-only skills: min = max so they never participate in quality scoring.
  // Primary ranges (lv1 min/max) are unknown — update when a primary-slot specimen is found.
  // Increment confirmed at 0.332%/lv from observed +1.66% secondary at sp_boss_dmg lv25.
  sp_world_boss_dmg: { minFn: lv => r(0.332 * lv), maxFn: lv => r(0.332 * lv), unit: 'percent', capLv: 25 },
  // Increment confirmed at 0.11%/lv from observed +1.33% secondary at sp_pvp_dmg lv1 + rune(+31).
  sp_pvp_def: { minFn: lv => r(0.11 * lv), maxFn: lv => r(0.11 * lv), unit: 'percent', capLv: 25 },
  sp_pvp_dmg:     { minFn: lv => r(0.89 + 0.11 * lv),  maxFn: lv => r(3.89 + 0.11 * lv),  unit: 'percent', capLv: 25 },
  sp_monster_dmg: { minFn: lv => r(14.67 + 0.33 * lv), maxFn: lv => r(22.67 + 0.33 * lv), unit: 'percent', capLv: 25 },

  // Regular skills — no cap, scales to Lv35
  field_combat_exp: { minFn: lv => r(1.67 + 0.33 * lv), maxFn: lv => r(4.67 + 0.33 * lv), unit: 'percent' },
  logging_exp:      { minFn: lv => r(1.67 + 0.33 * lv), maxFn: lv => r(4.67 + 0.33 * lv), unit: 'percent' },
  foraging_exp:     { minFn: lv => r(1.67 + 0.33 * lv), maxFn: lv => r(4.67 + 0.33 * lv), unit: 'percent' },
  mining_exp:       { minFn: lv => r(1.67 + 0.33 * lv), maxFn: lv => r(4.67 + 0.33 * lv), unit: 'percent' },
  fishing_exp:      { minFn: lv => r(1.67 + 0.33 * lv), maxFn: lv => r(4.67 + 0.33 * lv), unit: 'percent' },
  knowledge_rate:   { minFn: lv => r(1.67 + 0.33 * lv), maxFn: lv => r(4.67 + 0.33 * lv), unit: 'percent' },
  dark_energy_exp:  { minFn: lv => r(1.67 + 0.33 * lv), maxFn: lv => r(4.67 + 0.33 * lv), unit: 'percent' },

  // Inventory (LT weight) — no cap
  inventory: { minFn: lv => r(38.89 + 11.11 * lv), maxFn: lv => r(188.89 + 11.11 * lv), unit: 'lt' },

  // Exclusive skills — BiS (min = max, always S grade)
  // Lucky Black Dragon: +1% base, +0.1%/lv, verified at Lv30 = +3.9%
  ex_field_drop_rate: { minFn: lv => r(0.9 + 0.1 * lv), maxFn: lv => r(0.9 + 0.1 * lv), unit: 'percent' },
}

// Fixed secondary stat pairings per primary special skill.
// Skills confirmed to have no secondary: sp_max_hp, sp_monster_dmg, ex_field_drop_rate.
const SPECIAL_SKILL_SECONDARY: Record<string, string> = {
  sp_ap:         'sp_dp',
  sp_dp:         'sp_ap',
  sp_crit_dmg:   'sp_crit_rate',
  sp_crit_rate:  'sp_crit_dmg',
  sp_branch_dmg: 'sp_max_hp',
  sp_boss_dmg:   'sp_world_boss_dmg',
  sp_pvp_dmg:    'sp_pvp_def',
}

// Derives the per-level value increment for a secondary stat from its own formula.
// All current formulas are linear so f(2) - f(1) gives the exact increment.
function getSecondaryIncrement(skillId: string): number {
  const f = FORMULAS[skillId]
  if (!f) return 1
  return Math.round((f.maxFn(2) - f.maxFn(1)) * 10000) / 10000
}

// Returns the Added Effect for a special skill given its primary skillId, tier, and level.
// Unlocks at T7 and above, skill level 21+. Value = (level - 20) × secondary increment.
// Returns null if the tier/level threshold isn't met or no pairing is defined.
export function getSpecialSkillSecondary(
  primarySkillId: string,
  _tier: string,
  level: number,
  effectiveLevel?: number,
): { skillId: string; value: number; unit: SkillUnit } | null {
  const lvToUse = effectiveLevel ?? level
  if (lvToUse < 21) return null
  const secondaryId = SPECIAL_SKILL_SECONDARY[primarySkillId]
  if (!secondaryId) return null
  const increment = getSecondaryIncrement(secondaryId)
  const value = Math.round((lvToUse - 20) * increment * 10000) / 10000
  const unit = FORMULAS[secondaryId]?.unit ?? 'flat'
  return { skillId: secondaryId, value, unit }
}

export function getSkillRange(skillId: string, level: number, uncapped = false): { min: number; max: number; unit: SkillUnit } | null {
  const f = FORMULAS[skillId]
  if (!f) return null
  const lv = (!uncapped && f.capLv) ? Math.min(level, f.capLv) : level
  return { min: f.minFn(lv), max: f.maxFn(lv), unit: f.unit }
}

export function getRollQuality(skillId: string, level: number, value: number): number | null {
  const range = getSkillRange(skillId, level)
  if (!range) return null
  const { min, max } = range
  if (max === min) return 1
  return Math.max(0, Math.min(1, (value - min) / (max - min)))
}

export function formatSkillValue(value: number, unit: SkillUnit): string {
  if (unit === 'lt') return `+${value.toFixed(2)} LT`
  if (unit === 'percent') return `+${value.toFixed(2)}%`
  return `+${value}`
}

export function formatRange(min: number, max: number, unit: SkillUnit): string {
  return `${formatSkillValue(min, unit)} – ${formatSkillValue(max, unit)}`
}
