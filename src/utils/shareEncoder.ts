import LZString from 'lz-string'
import type { Pet, PetSkillEntry } from '../types'

// ---- Short code maps ----

const TIER_SHORT: Record<string, string> = {
  T1: '1', T2: '2', T3: '3', T4: '4', T5: '5',
  T6: '6', T6S: 'A', T7: '7', T7S: 'B', T7SS: 'C',
}
const TIER_LONG = Object.fromEntries(Object.entries(TIER_SHORT).map(([k, v]) => [v, k]))

const SKILL_SHORT: Record<string, string> = {
  sp_ap: 'sa', sp_dp: 'sd', sp_max_hp: 'sh', sp_boss_dmg: 'sb',
  sp_crit_dmg: 'sc', sp_crit_rate: 'sr', sp_branch_dmg: 'sk',
  sp_pvp_dmg: 'sp', sp_monster_dmg: 'sm',
  field_combat_exp: 'fc', logging_exp: 'le', foraging_exp: 'fo',
  mining_exp: 'mi', fishing_exp: 'fi', knowledge_rate: 'kr',
  dark_energy_exp: 'de', inventory: 'iv', ex_field_drop_rate: 'ed',
}
const SKILL_LONG = Object.fromEntries(Object.entries(SKILL_SHORT).map(([k, v]) => [v, k]))

// ---- Skill encoding ----
// Format: code:level:value  (value stored as integer *100 to avoid decimal separator clash)

function encodeSkill(entry: PetSkillEntry | null | undefined): string {
  if (!entry?.skillId) return '-'
  const code = SKILL_SHORT[entry.skillId] ?? entry.skillId
  const val = Math.round(entry.value * 100)
  return `${code}:${entry.level}:${val}`
}

function decodeSkill(s: string): PetSkillEntry | null {
  if (!s || s === '-') return null
  const [code, lv, val] = s.split(':')
  if (!code || !lv || !val) return null
  return {
    skillId: SKILL_LONG[code] ?? code,
    level: Number(lv),
    value: Number(val) / 100,
  }
}

// ---- Pet encoding ----
// Format: name|petType|tier|specialSkill,reg1,reg2,reg3,reg4
// Pets separated by ;

function encodePet(pet: Pet): string {
  const tier = TIER_SHORT[pet.tier] ?? pet.tier
  const skills = [
    encodeSkill(pet.specialSkill),
    ...pet.regularSkills.map(encodeSkill),
  ].join(',')
  return [pet.name, pet.petType, tier, skills].join('|')
}

function decodePet(s: string): Omit<Pet, 'id' | 'createdAt'> | null {
  const parts = s.split('|')
  if (parts.length < 4) return null
  const [name, petType, tierShort, skillsStr] = parts
  const tier = TIER_LONG[tierShort] ?? tierShort
  const skillParts = skillsStr.split(',')
  return {
    name,
    petType,
    tier,
    specialSkill: decodeSkill(skillParts[0]),
    regularSkills: skillParts.slice(1).map(decodeSkill),
  }
}

// ---- Public API ----

export function encodePets(pets: Pet[]): string {
  const raw = pets.map(encodePet).join(';')
  return LZString.compressToEncodedURIComponent(raw)
}

export function decodePets(encoded: string): Omit<Pet, 'id' | 'createdAt'>[] {
  try {
    const raw = LZString.decompressFromEncodedURIComponent(encoded)
    if (!raw) return []
    return raw.split(';').map(decodePet).filter(Boolean) as Omit<Pet, 'id' | 'createdAt'>[]
  } catch {
    return []
  }
}
