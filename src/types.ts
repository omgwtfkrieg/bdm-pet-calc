export type GameModeId = 'pve' | 'afk' | 'pvp' | 'boss' | 'progression'

// ---- My Pets ----

export interface PetSkillEntry {
  skillId: string
  level: number
  value: number // numeric value as shown in-game (no +/% suffix)
}

export interface Pet {
  id: string
  name: string
  petType: string          // used for image lookup: /pets/{petType}_Profile.PNG
  tier: string             // e.g. "T7SS"
  specialSkill: PetSkillEntry | null
  regularSkills: (PetSkillEntry | null)[]
  createdAt: string
}

export type SkillType = 'special' | 'regular'

export interface Skill {
  id: string
  name: string
  description: string
  category: string
  icon: string
  levels: string[]
  scores: Record<GameModeId, number>
  type: SkillType // injected at runtime
}

export interface SelectedSkill {
  skill: Skill
  level: number // 1-5
}

export interface GameMode {
  id: GameModeId
  name: string
  description: string
  icon: string
  color: string
  topSkills: string[]
}

// Slot config per tier: { special: number, regular: number }
export interface TierSlots {
  special: number
  regular: number
}
