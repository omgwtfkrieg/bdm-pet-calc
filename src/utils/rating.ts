import type { SelectedSkill, GameModeId } from '../types'

export function calcPetScore(selected: SelectedSkill[], mode: GameModeId): number {
  if (selected.length === 0) return 0
  const total = selected.reduce((sum, s) => {
    const base = s.skill.scores[mode]
    // Level multiplier: level 1 = 0.6x, level 5 = 1.0x
    const mult = 0.6 + (s.level / 5) * 0.4
    return sum + base * mult
  }, 0)
  return Math.round((total / selected.length) * 10) / 10
}

export function calcAllModeScores(selected: SelectedSkill[]): Record<GameModeId, number> {
  const modes: GameModeId[] = ['pve', 'afk', 'pvp', 'boss', 'progression']
  return Object.fromEntries(modes.map(m => [m, calcPetScore(selected, m)])) as Record<GameModeId, number>
}

export function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 8.5) return { label: 'S', color: '#ffd600' }
  if (score >= 7.5) return { label: 'A', color: '#66bb6a' }
  if (score >= 6)   return { label: 'B', color: '#42a5f5' }
  if (score >= 4.5) return { label: 'C', color: '#ff9800' }
  return { label: 'D', color: '#ef5350' }
}
