import { useState } from 'react'
import {
  Box, Typography, ToggleButtonGroup, ToggleButton,
  Paper, Tooltip, Tab, Tabs,
} from '@mui/material'
import gameModesData from '../data/gameModes.json'
import { specialSkills, regularSkills } from '../data/useSkills'
import type { GameMode, GameModeId, Skill } from '../types'

const gameModes = gameModesData as GameMode[]

const TIER_RANKS = [
  { label: 'S', min: 8.5 },
  { label: 'A', min: 7.5 },
  { label: 'B', min: 6 },
  { label: 'C', min: 4.5 },
  { label: 'D', min: 0 },
]

const tierColors: Record<string, string> = {
  S: '#ffd600', A: '#66bb6a', B: '#42a5f5', C: '#ff9800', D: '#ef5350',
}

function SkillTierList({ skills, mode }: { skills: Skill[]; mode: GameModeId }) {
  const sorted = [...skills].sort((a, b) => b.scores[mode] - a.scores[mode])

  const byTier = TIER_RANKS.map((t, idx) => ({
    ...t,
    skills: sorted.filter(s => {
      const score = s.scores[mode]
      const prevMin = TIER_RANKS[idx - 1]?.min ?? Infinity
      return score >= t.min && score < prevMin
    }),
  })).filter(t => t.skills.length > 0)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {byTier.map(tier => (
        <Paper key={tier.label} variant="outlined" sx={{ overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
            <Box sx={{
              width: 52,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: tierColors[tier.label] + '22',
              borderRight: `3px solid ${tierColors[tier.label]}`,
              flexShrink: 0,
            }}>
              <Typography sx={{ fontSize: 24, fontWeight: 900, color: tierColors[tier.label] }}>
                {tier.label}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 1.5 }}>
              {tier.skills.map(skill => (
                <Tooltip
                  key={skill.id}
                  title={
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{skill.name}</Typography><br />
                      <Typography variant="caption">{skill.description}</Typography><br />
                      <Typography variant="caption" color="text.secondary">Max (Lv5): {skill.levels[4]}</Typography>
                    </Box>
                  }
                >
                  <Paper variant="outlined" sx={{
                    px: 1.5, py: 0.75,
                    display: 'flex', alignItems: 'center', gap: 1,
                    borderColor: tierColors[tier.label] + '55',
                    cursor: 'default',
                    '&:hover': { borderColor: tierColors[tier.label] },
                    transition: 'border-color 0.15s',
                  }}>
                    <span style={{ fontSize: 16 }}>{skill.icon}</span>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{skill.name}</Typography><br />
                      <Typography variant="caption" color="text.secondary">{skill.scores[mode]}/10</Typography>
                    </Box>
                  </Paper>
                </Tooltip>
              ))}
            </Box>
          </Box>
        </Paper>
      ))}
    </Box>
  )
}

export function TierListPage() {
  const [mode, setMode] = useState<GameModeId>('pve')
  const [skillTab, setSkillTab] = useState(0) // 0 = special, 1 = regular

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5">Skill Tier List</Typography>
        <Typography variant="body2" color="text.secondary">Skills ranked by value for each game mode</Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>GAME MODE</Typography>
        <ToggleButtonGroup value={mode} exclusive onChange={(_, v) => v && setMode(v)} size="small" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          {gameModes.map(m => (
            <ToggleButton key={m.id} value={m.id} sx={{ px: 2, fontWeight: 600 }}>
              <span style={{ marginRight: 6 }}>{m.icon}</span>{m.name}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Tabs value={skillTab} onChange={(_, v) => setSkillTab(v)} sx={{ mb: 2 }}>
        <Tab label="✦ Special Skills (T5+)" />
        <Tab label="Regular Skills" />
      </Tabs>

      {skillTab === 0
        ? <SkillTierList skills={specialSkills} mode={mode} />
        : <SkillTierList skills={regularSkills} mode={mode} />
      }
    </Box>
  )
}
