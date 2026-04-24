import { useState } from 'react'
import {
  Box, Typography, Grid, Paper, ToggleButtonGroup,
  ToggleButton, Chip, Divider,
} from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import gameModesData from '../data/gameModes.json'
import { specialSkills, regularSkills } from '../data/useSkills'
import { TIER_SLOTS, TIERS } from '../data/tiers'
import type { Skill, GameMode, GameModeId } from '../types'
import { ScoreBadge } from '../components/ScoreBadge'
import { calcPetScore } from '../utils/rating'
import { encodeBuild } from '../utils/urlEncoder'

const gameModes = gameModesData as GameMode[]

function topSkillsForMode(skills: Skill[], mode: GameModeId, count: number): Skill[] {
  return [...skills].sort((a, b) => b.scores[mode] - a.scores[mode]).slice(0, count)
}

function RecommendedBuild({ mode, tier }: { mode: GameMode; tier: string }) {
  const tierSlots = TIER_SLOTS[tier]
  const topSpecial = tierSlots.special > 0 ? topSkillsForMode(specialSkills, mode.id, tierSlots.special) : []
  const topRegular = topSkillsForMode(regularSkills, mode.id, tierSlots.regular)
  const allSelected = [
    ...topSpecial.map(skill => ({ skill, level: 5 })),
    ...topRegular.map(skill => ({ skill, level: 5 })),
  ]
  const score = calcPetScore(allSelected, mode.id)

  function handleOpen() {
    const url = encodeBuild(tier, allSelected)
    window.location.href = url
  }

  return (
    <Paper variant="outlined" sx={{
      p: 2,
      borderColor: mode.color + '44',
      '&:hover': { borderColor: mode.color },
      transition: 'border-color 0.15s',
      height: '100%',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span style={{ fontSize: 20 }}>{mode.icon}</span>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{mode.name}</Typography>
            <Typography variant="caption" color="text.secondary">{mode.description}</Typography>
          </Box>
        </Box>
        <ScoreBadge score={score} size="sm" />
      </Box>

      <Divider sx={{ mb: 1.5 }} />

      {topSpecial.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700,  mb: 0.5, display: 'block'  }}>
            ✦ Special
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {topSpecial.map(skill => (
              <Chip key={skill.id} label={`${skill.icon} ${skill.name}`} size="small"
                variant="outlined" sx={{ borderColor: 'primary.main', fontSize: 11 }} />
            ))}
          </Box>
        </Box>
      )}

      <Box sx={{ mb: 1.5 }}>
        {topSpecial.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700,  mb: 0.5, display: 'block'  }}>
            Regular
          </Typography>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {topRegular.map(skill => (
            <Chip key={skill.id} label={`${skill.icon} ${skill.name}`} size="small"
              variant="outlined" sx={{ borderColor: mode.color + '55', fontSize: 11 }} />
          ))}
        </Box>
      </Box>

      <Typography variant="caption" color="primary.main" sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}
        onClick={handleOpen}>
        <OpenInNewIcon sx={{ fontSize: 12 }} />
        Open in Builder
      </Typography>
    </Paper>
  )
}

export function RecommendationsPage() {
  const [tier, setTier] = useState('T5')

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5">Recommendations</Typography>
        <Typography variant="body2" color="text.secondary">Best skill combos per game mode and pet tier</Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600,  mb: 1, display: 'block'  }}>PET TIER</Typography>
        <ToggleButtonGroup value={tier} exclusive onChange={(_, v) => v && setTier(v)} size="small">
          {TIERS.map(t => (
            <ToggleButton key={t} value={t} sx={{ px: 2.5, fontWeight: 700 }}>
              {t}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={2}>
        {gameModes.map(mode => (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={mode.id}>
            <RecommendedBuild mode={mode} tier={tier} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
