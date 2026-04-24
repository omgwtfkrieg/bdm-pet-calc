import type { SelectedSkill } from '../types'

export function encodeBuild(tier: string, skills: SelectedSkill[]): string {
  const params = new URLSearchParams()
  params.set('tier', tier)
  skills.forEach((s, i) => {
    params.set(`s${i + 1}`, `${s.skill.id}:${s.level}`)
  })
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`
}

export function decodeBuild(search: string): { tier: string; slots: Array<{ id: string; level: number }> } | null {
  const params = new URLSearchParams(search)
  const tier = params.get('tier')
  if (!tier) return null

  const slots: Array<{ id: string; level: number }> = []
  for (let i = 1; i <= 4; i++) {
    const val = params.get(`s${i}`)
    if (!val) break
    const [id, lvl] = val.split(':')
    slots.push({ id, level: parseInt(lvl) || 1 })
  }

  return { tier, slots }
}
