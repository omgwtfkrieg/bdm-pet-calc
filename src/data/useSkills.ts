// Single place that imports skills.json and tags each skill with its type
import rawData from './skills.json'
import type { Skill } from '../types'

const specialSkills: Skill[] = rawData.special.map(s => ({ ...s, type: 'special' as const }))
const regularSkills: Skill[] = rawData.regular.map(s => ({ ...s, type: 'regular' as const }))
const exclusiveSkills: Skill[] = rawData.exclusive.map(s => ({ ...s, type: 'regular' as const }))
const allSkills: Skill[] = [...specialSkills, ...regularSkills, ...exclusiveSkills]

// Skills that can appear as primary special skill slots (excludes secondary-only Added Effects)
const primarySpecialSkills: Skill[] = [...specialSkills, ...exclusiveSkills]
  .filter(s => !(s as Skill & { secondaryOnly?: boolean }).secondaryOnly)

export { specialSkills, regularSkills, exclusiveSkills, allSkills, primarySpecialSkills }
