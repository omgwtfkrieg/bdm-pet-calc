import type { Pet } from '../types'
import { getRollQuality, getSkillRange, getSpecialSkillSecondary } from './skillLevels'
import type { TeamMode } from '../data/teamModes'
import type { RuneConfig } from './runeCalc'
import { getRuneLevelBonus } from './runeCalc'

// Tier ranks — used for skin/fodder/invest analysis only (not scoring)
export const TIER_RANK: Record<string, number> = {
  T1: 1, T2: 2, T3: 3, T4: 4, T5: 5, T6: 6, T6S: 7, T7: 8, T7S: 9, T7SS: 10,
}

const MID_TIERS = new Set(['T5', 'T6', 'T6S'])
const TEAM_SIZE = 3
const NON_STACKING = new Set(['ex_field_drop_rate'])

// Single source of truth for mode recommendation criteria.
// S-tier (quality ≥ 0.8) OR top-3 roster holder qualifies a pet for a mode.
// fallback skills are only used when no pet qualifies via primary groups.
export const MODE_RULES: Record<string, { groups: string[][], fallback?: string[] }> = {
  leveling:    { groups: [['field_combat_exp'], ['sp_ap', 'sp_dp', 'sp_monster_dmg']] },
  grinding:    { groups: [['ex_field_drop_rate', 'sp_ap', 'sp_dp', 'sp_monster_dmg'], ['field_combat_exp']], fallback: ['inventory'] },
  boss:        { groups: [['sp_boss_dmg'], ['sp_ap', 'sp_dp', 'sp_crit_dmg', 'sp_crit_rate', 'sp_max_hp', 'sp_branch_dmg']] },
  world_boss:  { groups: [['sp_world_boss_dmg'], ['sp_ap', 'sp_dp', 'sp_crit_dmg', 'sp_crit_rate', 'sp_max_hp', 'sp_branch_dmg']] },
  pvp:         { groups: [['sp_pvp_dmg', 'sp_pvp_def'], ['sp_ap', 'sp_dp', 'sp_crit_dmg', 'sp_crit_rate', 'sp_max_hp', 'sp_branch_dmg']] },
  knowledge:   { groups: [['knowledge_rate'], ['sp_ap', 'sp_dp', 'field_combat_exp', 'sp_monster_dmg']] },
  logging:     { groups: [['logging_exp']] },
  mining:      { groups: [['mining_exp']] },
  foraging:    { groups: [['foraging_exp']] },
  fishing:     { groups: [['fishing_exp']] },
  dark_energy: { groups: [['dark_energy_exp']] },
}

export function getPetQuality(pet: Pet): number | null {
  const entries = getEntries(pet)
  if (entries.length === 0) return null
  const qualities = entries
    .map(e => getRollQuality(e.skillId, e.level, e.value))
    .filter((q): q is number => q !== null)
  if (qualities.length === 0) return null
  return qualities.reduce((a, b) => a + b, 0) / qualities.length
}

export function getEntries(pet: Pet): NonNullable<Pet['specialSkill']>[] {
  return [
    ...(pet.specialSkill ? [pet.specialSkill] : []),
    ...pet.regularSkills.filter(Boolean),
  ] as NonNullable<Pet['specialSkill']>[]
}

// Returns the skill entry (level + value) for a pet, checking both direct entries
// and the derived secondary effect of the special skill (e.g. sp_world_boss_dmg from sp_boss_dmg).
// Rune-adjusted effective level is used for secondary effect lookup when rune is active.
function getEntryOrSecondary(
  pet: Pet,
  skillId: string,
  runeConfig: RuneConfig | null = null,
): { level: number; value: number } | null {
  const direct = getEntries(pet).find(e => e.skillId === skillId)
  if (direct) return direct
  if (!pet.specialSkill) return null
  let effectiveLevel: number | undefined
  if (runeConfig?.enabled) {
    const { primary } = getRuneLevelBonus(runeConfig)
    effectiveLevel = Math.min(pet.specialSkill.level, 25) + primary
  }
  const sec = getSpecialSkillSecondary(pet.specialSkill.skillId, pet.tier, pet.specialSkill.level, effectiveLevel)
  return sec?.skillId === skillId ? { level: effectiveLevel ?? pet.specialSkill.level, value: sec.value } : null
}

// Returns the effective skill value, applying rune level boost for special skill slots.
// Uses quality-preserving interpolation: same roll quality, evaluated at the rune-adjusted level.
// Falls back to raw value if skill has no formula at the effective level.
function getEffectiveValue(
  entry: NonNullable<Pet['specialSkill']>,
  isSpecial: boolean,
  runeConfig: RuneConfig | null,
): number {
  if (!isSpecial || !runeConfig?.enabled) return entry.value
  const { primary } = getRuneLevelBonus(runeConfig)
  const effectiveLevel = Math.min(entry.level, 25) + primary
  if (effectiveLevel <= entry.level) return entry.value
  const q = getRollQuality(entry.skillId, entry.level, entry.value)
  if (q === null) return entry.value
  const range = getSkillRange(entry.skillId, effectiveLevel, true)
  if (!range) return entry.value
  return range.min + q * (range.max - range.min)
}

// Pre-computes top value holders per skill across the roster.
// Ranks by absolute skill value (rune-adjusted for special skills), not roll quality.
// topN controls how many holders qualify per skill (default TEAM_SIZE for chips;
// pass pets.length in findBestTeam to consider the full roster).
export function computeTopBySkill(pets: Pet[], runeConfig: RuneConfig | null = null, topN = TEAM_SIZE): Map<string, Set<string>> {
  const topBySkill = new Map<string, Set<string>>()
  // Include secondary effect skill IDs (e.g. sp_world_boss_dmg from sp_boss_dmg)
  const allSkillIds = new Set(pets.flatMap(p => {
    const ids = getEntries(p).map(e => e.skillId)
    if (p.specialSkill) {
      const sec = getSpecialSkillSecondary(p.specialSkill.skillId, p.tier, p.specialSkill.level)
      if (sec) ids.push(sec.skillId)
    }
    return ids
  }))
  for (const skillId of allSkillIds) {
    const holders = pets
      .flatMap(p => {
        const direct = getEntries(p).find(e => e.skillId === skillId)
        if (direct) {
          const isSpecial = p.specialSkill?.skillId === skillId
          return [{ petId: p.id, val: getEffectiveValue(direct, isSpecial, runeConfig) }]
        }
        // Secondary effect path — value already rune-adjusted inside getEntryOrSecondary
        const sec = getEntryOrSecondary(p, skillId, runeConfig)
        if (!sec) return []
        return [{ petId: p.id, val: sec.value }]
      })
      .sort((a, b) => b.val - a.val)
    const limit = NON_STACKING.has(skillId) ? 1 : topN
    topBySkill.set(skillId, new Set(holders.slice(0, limit).map(h => h.petId)))
  }
  return topBySkill
}

// A pet qualifies for a skill if it is in the top-3 by value for that skill in the roster.
function qualifiesForSkill(
  pet: Pet,
  skillId: string,
  topBySkill: Map<string, Set<string>>,
): boolean {
  return topBySkill.get(skillId)?.has(pet.id) ?? false
}

// Score a team for a mode using MODE_RULES.
// Group 0 (the primary group) is weighted 100× over subsequent groups so the optimizer
// always covers the most important skill first. Fallback skills get 0.1× weight.
// Quality (0-1, rune-invariant) is used for scoring so different skill units stay comparable.
export function scoreTeam(
  team: Pet[],
  modeId: string,
  topBySkill: Map<string, Set<string>>,
  runeConfig: RuneConfig | null = null,
): number {
  const rule = MODE_RULES[modeId]
  if (!rule) return 0
  const nonStackingBest = new Map<string, number>()
  let score = 0

  const processSkills = (skills: string[], w: number) => {
    for (const pet of team) {
      for (const skillId of skills) {
        if (!qualifiesForSkill(pet, skillId, topBySkill)) continue
        const ent = getEntryOrSecondary(pet, skillId, runeConfig)
        if (!ent) continue
        const q = getRollQuality(skillId, ent.level, ent.value) ?? 0
        if (NON_STACKING.has(skillId)) {
          nonStackingBest.set(skillId, Math.max(nonStackingBest.get(skillId) ?? 0, q * w))
        } else {
          score += q * w
        }
      }
    }
  }

  rule.groups.forEach((group, i) => processSkills(group, i === 0 ? 100 : 1))
  if (rule.fallback) processSkills(rule.fallback, 0.1)

  for (const val of nonStackingBest.values()) score += val
  return score
}

export function findBestTeam(pets: Pet[], modeId: string, runeConfig: RuneConfig | null = null): Pet[] {
  if (pets.length === 0) return []
  const rule = MODE_RULES[modeId]
  if (!rule) return []
  if (pets.length <= TEAM_SIZE) return pets

  const team: Pet[] = []
  const used = new Set<string>()

  const primaryGroup = rule.groups[0]
  const secondarySkills = rule.groups.slice(1).flat()

  // Use the full roster as the qualification pool so that combo pets with slightly
  // lower primary values aren't cut off by the top-3 chip limit.
  const topBySkill = computeTopBySkill(pets, runeConfig, pets.length)

  const bestQuality = (pet: Pet, skills: string[]): number => {
    let best = 0
    for (const sk of skills) {
      if (!qualifiesForSkill(pet, sk, topBySkill)) continue
      const ent = getEntryOrSecondary(pet, sk, runeConfig)
      if (!ent) continue
      best = Math.max(best, getRollQuality(sk, ent.level, ent.value) ?? 0)
    }
    return best
  }

  // Tracks which non-stacking skills are already claimed by the current team.
  const claimedNonStacking = new Set<string>()

  const hasNonStackingConflict = (pet: Pet): boolean =>
    [...NON_STACKING].some(sk =>
      claimedNonStacking.has(sk) && getEntries(pet).some(e => e.skillId === sk)
    )

  const addToTeam = (pet: Pet) => {
    team.push(pet)
    used.add(pet.id)
    for (const sk of NON_STACKING) {
      if (getEntries(pet).some(e => e.skillId === sk)) claimedNonStacking.add(sk)
    }
  }

  // Picks non-conflicting pets first; returns the ones with a non-stacking conflict
  // so they can be used as a last resort after all better options are exhausted.
  const pickNonConflicting = (sorted: Pet[]): Pet[] => {
    const deferred: Pet[] = []
    for (const p of sorted) {
      if (team.length >= TEAM_SIZE) break
      if (used.has(p.id)) continue
      if (hasNonStackingConflict(p)) { deferred.push(p) }
      else { addToTeam(p) }
    }
    return deferred
  }

  // Step 1: primary-group pets sorted by primary quality + 0.3 × secondary quality.
  // This ensures combo pets (e.g. field_combat_exp + AP) rank above primary-only pets
  // even when the primary-only pet has a marginally higher raw value.
  const primarySorted = pets
    .filter(p => primaryGroup.some(sk => qualifiesForSkill(p, sk, topBySkill)))
    .sort((a, b) => {
      const sa = bestQuality(a, primaryGroup) + 0.3 * bestQuality(a, secondarySkills)
      const sb = bestQuality(b, primaryGroup) + 0.3 * bestQuality(b, secondarySkills)
      return sb - sa
    })
  const deferredPrimary = pickNonConflicting(primarySorted)

  // Step 2: secondary-group pets (fallback when fewer than TEAM_SIZE primary pets exist).
  const secondarySorted = pets
    .filter(p => !used.has(p.id) && secondarySkills.some(sk => qualifiesForSkill(p, sk, topBySkill)))
    .sort((a, b) => bestQuality(b, secondarySkills) - bestQuality(a, secondarySkills))
  const deferredSecondary = pickNonConflicting(secondarySorted)

  // Step 3: fallback skills (e.g. inventory for grinding when nothing else qualifies).
  let deferredFallback: Pet[] = []
  if (team.length < TEAM_SIZE && rule.fallback?.length) {
    const fallbackSorted = pets
      .filter(p => !used.has(p.id) && rule.fallback!.some(sk => qualifiesForSkill(p, sk, topBySkill)))
    deferredFallback = pickNonConflicting(fallbackSorted)
  }

  // Step 4: last resort — non-stacking-conflicting pets only if team still not full.
  for (const p of [...deferredPrimary, ...deferredSecondary, ...deferredFallback]) {
    if (team.length >= TEAM_SIZE) break
    if (!used.has(p.id)) addToTeam(p)
  }

  return team
}

export function computePetModeRecommendations(pets: Pet[], _modes: TeamMode[], runeConfig: RuneConfig | null = null): Map<string, string[]> {
  const topBySkill = computeTopBySkill(pets, runeConfig)
  const result = new Map<string, string[]>()

  for (const [modeId, rule] of Object.entries(MODE_RULES)) {
    const anyPrimaryQualifies = pets.some(p =>
      rule.groups.some(group => group.some(skillId => qualifiesForSkill(p, skillId, topBySkill)))
    )
    for (const pet of pets) {
      const primaryQualifies = rule.groups.some(group =>
        group.some(skillId => qualifiesForSkill(pet, skillId, topBySkill))
      )
      const fallbackQualifies = !anyPrimaryQualifies &&
        (rule.fallback?.some(skillId => qualifiesForSkill(pet, skillId, topBySkill)) ?? false)
      if (primaryQualifies || fallbackQualifies) {
        const current = result.get(pet.id) ?? []
        current.push(modeId)
        result.set(pet.id, current)
      }
    }
  }
  return result
}

// Computes 'skin' or 'fodder' for every pet based on per-type ranking
export function computePetFlags(pets: Pet[]): Map<string, 'skin' | 'fodder'> {
  const groups = new Map<string, Pet[]>()
  for (const pet of pets) {
    const list = groups.get(pet.petType) ?? []
    list.push(pet)
    groups.set(pet.petType, list)
  }
  const flags = new Map<string, 'skin' | 'fodder'>()
  for (const [, group] of groups) {
    if (group.length === 1) {
      flags.set(group[0].id, 'skin')  // unique one-of-a-kind — never fodder
      continue
    }
    const sorted = [...group].sort((a, b) => {
      const sa = (TIER_RANK[a.tier] ?? 0) * 100 + (getPetQuality(a) ?? 0) * 10
      const sb = (TIER_RANK[b.tier] ?? 0) * 100 + (getPetQuality(b) ?? 0) * 10
      return sb - sa
    })
    flags.set(sorted[0].id, 'skin')
    for (const pet of sorted.slice(1)) {
      if ((getPetQuality(pet) ?? 0) >= 0.8) continue  // S-grade pets are never fodder
      flags.set(pet.id, 'fodder')
    }
  }
  return flags
}

// Tiers where rerolling makes sense (requires T5 fodder as cost)
const REROLL_TIERS = new Set(['T5', 'T6', 'T6S', 'T7', 'T7S', 'T7SS'])

export interface RerollSuggestion {
  skillId: string         // the regular skill slot to reroll
  currentQuality: number  // current quality of that slot
  qualityNeededForS: number  // minimum quality the replacement needs for overall to reach S
  minGradeNeeded: 'B' | 'A' | 'S'  // human-readable minimum
}

// For a pet with B–A overall, finds the regular skill slot that, if rerolled to a
// good enough replacement, would push the pet's overall quality to S grade.
// Returns the easiest slot to improve (lowest quality-needed threshold).
// Returns null if the pet is already S, too far from S, or no feasible reroll exists.
export function getRerollSuggestion(pet: Pet): RerollSuggestion | null {
  if (!REROLL_TIERS.has(pet.tier)) return null

  // Build indexed entries, tracking which are regular (rerollable) vs special (not)
  const indexed = [
    ...(pet.specialSkill ? [{ entry: pet.specialSkill, isRegular: false }] : []),
    ...pet.regularSkills.filter(Boolean).map(e => ({ entry: e!, isRegular: true })),
  ]
  if (indexed.length === 0) return null

  const qualities = indexed.map(({ entry }) =>
    getRollQuality(entry.skillId, entry.level, entry.value) ?? 0
  )

  const n = qualities.length
  const totalQ = qualities.reduce((a, b) => a + b, 0)
  const overallQ = totalQ / n

  // Only suggest for pets that are B–A grade — close enough to S to be actionable
  if (overallQ >= 0.8 || overallQ < 0.4) return null

  let best: RerollSuggestion | null = null

  indexed.forEach(({ entry, isRegular }, idx) => {
    if (!isRegular) return  // special skill slot is not rerollable

    const currentQ = qualities[idx]
    // What quality does the replacement need so that new overall >= 0.8 (S)?
    // new_overall = (totalQ - currentQ + replacementQ) / n >= 0.8
    // replacementQ >= 0.8*n - (totalQ - currentQ)
    const needed = 0.8 * n - (totalQ - currentQ)

    if (needed > 1.0) return  // even a perfect roll can't reach S

    const minGrade: 'B' | 'A' | 'S' =
      needed <= 0.4 ? 'B' : needed <= 0.6 ? 'A' : 'S'

    // Prefer the slot with the lowest threshold (easiest improvement)
    if (!best || needed < best.qualityNeededForS) {
      best = { skillId: entry.skillId, currentQuality: currentQ, qualityNeededForS: needed, minGradeNeeded: minGrade }
    }
  })

  return best
}

// Investment analysis for T5/T6/T6S pets.
// 'invest' = worth leveling/improving. 'fodder_mid' = low value, consider sacrificing.
export function computeInvestFlags(pets: Pet[]): Map<string, 'invest' | 'fodder_mid'> {
  const result = new Map<string, 'invest' | 'fodder_mid'>()

  for (const pet of pets) {
    if (!MID_TIERS.has(pet.tier)) continue

    const others = pets.filter(p => p.id !== pet.id)
    const entries = getEntries(pet)

    // Special skill is S-grade AND no higher-tier pet in the roster has that same special skill
    const hasValuableSpecial = (() => {
      if (!pet.specialSkill) return false
      const q = getRollQuality(pet.specialSkill.skillId, pet.specialSkill.level, pet.specialSkill.value)
      if (!q || q < 0.8) return false
      const myRank = TIER_RANK[pet.tier] ?? 0
      const coveredByHigherTier = others.some(p =>
        (TIER_RANK[p.tier] ?? 0) > myRank &&
        p.specialSkill?.skillId === pet.specialSkill!.skillId
      )
      return !coveredByHigherTier
    })()

    // Has a skill no other pet in the roster has
    const otherSkillIds = new Set(others.flatMap(p => getEntries(p).map(e => e.skillId)))
    const hasUniqueSkill = entries.some(e => !otherSkillIds.has(e.skillId))

    // Has better quality on a skill than all other pets with that skill
    const hasBestSkill = entries.some(e => {
      const myQ = getRollQuality(e.skillId, e.level, e.value) ?? 0
      if (myQ === 0) return false
      const bestOther = others
        .flatMap(p => getEntries(p))
        .filter(e2 => e2.skillId === e.skillId)
        .reduce((best, e2) => Math.max(best, getRollQuality(e2.skillId, e2.level, e2.value) ?? 0), 0)
      return myQ > bestOther
    })

    // Unique pet type — no other pet of this type in the collection
    const isUniqueType = !others.some(p => p.petType === pet.petType)

    // 1 regular skill reroll away from S overall, and the threshold is achievable (B or A grade — not a miracle)
    const isRerollCandidate = (() => {
      const hint = getRerollSuggestion(pet)
      return hint !== null && hint.minGradeNeeded !== 'S'
    })()

    const isWorthInvesting = hasValuableSpecial || hasUniqueSkill || hasBestSkill || isUniqueType || isRerollCandidate
    result.set(pet.id, isWorthInvesting ? 'invest' : 'fodder_mid')
  }

  return result
}
