import { useState, useEffect } from 'react'
import {
  Box, Typography, ToggleButtonGroup, ToggleButton, Grid,
  Button, Snackbar, Alert, Divider, Paper, Chip,
} from '@mui/material'
import ShareIcon from '@mui/icons-material/Share'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import gameModesData from '../data/gameModes.json'
import { specialSkills, regularSkills, allSkills } from '../data/useSkills'
import { TIER_SLOTS, TIERS } from '../data/tiers'
import type { SelectedSkill, GameMode } from '../types'
import { SkillSelector } from '../components/SkillSelector'
import { ModeScoreCard } from '../components/ModeScoreCard'
import { ScoreBadge } from '../components/ScoreBadge'
import { calcAllModeScores } from '../utils/rating'
import { encodeBuild, decodeBuild } from '../utils/urlEncoder'

const gameModes = gameModesData as GameMode[]

type SlotState = SelectedSkill | null

export function BuilderPage() {
  const [tier, setTier] = useState('T5')
  // Index 0 = special slot, indices 1-4 = regular slots
  const [slots, setSlots] = useState<SlotState[]>([null, null, null, null, null])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const decoded = decodeBuild(window.location.search)
    if (!decoded) return
    setTier(decoded.tier)
    const loaded: SlotState[] = [null, null, null, null, null]
    decoded.slots.forEach(({ id, level }, i) => {
      const skill = allSkills.find(s => s.id === id)
      if (skill) loaded[i] = { skill, level }
    })
    setSlots(loaded)
  }, [])

  const tierSlots = TIER_SLOTS[tier]
  const hasSpecial = tierSlots.special > 0

  // Active slot indices
  const specialSlotActive = hasSpecial ? [slots[0]] : []
  const regularSlotCount = tierSlots.regular
  const regularSlotsActive = slots.slice(1, 1 + regularSlotCount)

  const filledSpecial = specialSlotActive.filter(Boolean) as SelectedSkill[]
  const filledRegular = regularSlotsActive.filter(Boolean) as SelectedSkill[]
  const allFilled = [...filledSpecial, ...filledRegular]

  const usedSpecialIds = filledSpecial.map(s => s.skill.id)
  const usedRegularIds = filledRegular.map(s => s.skill.id)

  const modeScores = calcAllModeScores(allFilled)
  const bestMode = gameModes.reduce((best, m) =>
    modeScores[m.id] > modeScores[best.id] ? m : best, gameModes[0])

  const overallScore = allFilled.length > 0
    ? Math.round((Object.values(modeScores).reduce((a, b) => a + b, 0) / gameModes.length) * 10) / 10
    : 0

  function updateSlot(i: number, val: SlotState) {
    setSlots(prev => prev.map((s, idx) => idx === i ? val : s))
  }

  function handleTierChange(_: unknown, val: string | null) {
    if (!val) return
    setTier(val)
    setSlots([null, null, null, null, null])
  }

  function handleShare() {
    const allSlots = [...(hasSpecial ? [slots[0]] : []), ...slots.slice(1, 1 + regularSlotCount)]
    const filled = allSlots.filter(Boolean) as SelectedSkill[]
    navigator.clipboard.writeText(encodeBuild(tier, filled))
    setCopied(true)
  }

  function handleReset() {
    setSlots([null, null, null, null, null])
    window.history.replaceState(null, '', window.location.pathname)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5">Pet Builder</Typography>
          <Typography variant="body2" color="text.secondary">
            Select your pet tier and skills to calculate its rating
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<RestartAltIcon />} onClick={handleReset} color="inherit" size="small">Reset</Button>
          <Button startIcon={<ShareIcon />} variant="contained" onClick={handleShare} disabled={allFilled.length === 0} size="small">
            Copy Link
          </Button>
        </Box>
      </Box>

      {/* Tier selector */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600,  mb: 1, display: 'block'  }}>
          PET TIER
        </Typography>
        <ToggleButtonGroup value={tier} exclusive onChange={handleTierChange} size="small">
          {TIERS.map(t => (
            <ToggleButton key={t} value={t} sx={{ px: 2.5, fontWeight: 700 }}>
              {t}
              {TIER_SLOTS[t].special > 0 && (
                <Chip label="Special" size="small" sx={{ ml: 1, height: 16, fontSize: 9, bgcolor: '#c9a84c33', color: 'primary.main' }} />
              )}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          {/* Special slot */}
          {hasSpecial && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>
                  ✦ SPECIAL SKILL SLOT
                </Typography>
                <Chip label="T5+ only" size="small" sx={{ height: 16, fontSize: 9 }} />
              </Box>
              <SkillSelector
                label="Special Skill"
                skills={specialSkills}
                value={slots[0]}
                usedIds={usedSpecialIds.filter(id => id !== slots[0]?.skill.id)}
                onChange={(val) => updateSlot(0, val)}
              />
            </Box>
          )}

          {/* Regular slots */}
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600,  mb: 1, display: 'block'  }}>
            REGULAR SKILLS
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {Array.from({ length: regularSlotCount }).map((_, i) => (
              <SkillSelector
                key={i}
                label={`Skill Slot ${i + 1}`}
                skills={regularSkills}
                value={slots[i + 1]}
                usedIds={usedRegularIds.filter(id => id !== slots[i + 1]?.skill.id)}
                onChange={(val) => updateSlot(i + 1, val)}
              />
            ))}
          </Box>
        </Grid>

        {/* Ratings */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600,  mb: 1, display: 'block'  }}>
            RATINGS
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            {allFilled.length === 0 ? (
              <Typography variant="body2" color="text.disabled" sx={{ py: 3, textAlign: 'center' }}>
                Add skills to see ratings
              </Typography>
            ) : (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <ScoreBadge score={overallScore} size="lg" />
                  <Box>
                    <Typography variant="h6">Overall Score</Typography>
                    <Chip
                      label={`Best for: ${bestMode.icon} ${bestMode.name}`}
                      size="small"
                      sx={{ bgcolor: bestMode.color + '33', color: bestMode.color, fontWeight: 700 }}
                    />
                  </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {gameModes.map(mode => (
                    <ModeScoreCard key={mode.id} mode={mode} score={modeScores[mode.id]} />
                  ))}
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={copied} autoHideDuration={2500} onClose={() => setCopied(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success">Build link copied to clipboard!</Alert>
      </Snackbar>
    </Box>
  )
}
