import { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, Tabs, Tab, Box, Typography,
  Chip, Grid, IconButton,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { allSkills } from '../data/useSkills'
import { getRollQuality } from '../utils/skillLevels'
import { PetImage } from './PetImage'
import { PET_TYPES } from '../data/petTypes'
import type { Pet } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  pets: Pet[]
  petFlags: Map<string, 'skin' | 'fodder'>
}

export function RosterSummaryModal({ open, onClose, pets, petFlags }: Props) {
  const [tab, setTab] = useState(0)

  // ---- Skills summary ----
  const skillStats = allSkills.map(skill => {
    let sCount = 0
    let totalCount = 0
    for (const pet of pets) {
      const entries = [pet.specialSkill, ...pet.regularSkills].filter(
        (e): e is NonNullable<Pet['specialSkill']> => e != null
      )
      for (const entry of entries) {
        if (entry.skillId !== skill.id) continue
        totalCount++
        const q = getRollQuality(entry.skillId, entry.level, entry.value)
        if (q !== null && q >= 0.8) sCount++
      }
    }
    return { ...skill, sCount, totalCount }
  })

  const presentSkills = skillStats
    .filter(s => s.totalCount > 0)
    .sort((a, b) => b.sCount - a.sCount || b.totalCount - a.totalCount)

  const absentSkills = skillStats.filter(s => s.totalCount === 0)

  const totalSGradeSkills = presentSkills.reduce((sum, s) => sum + s.sCount, 0)
  const skillsWithS = presentSkills.filter(s => s.sCount > 0).length

  // ---- Pet collection summary ----
  const ownedTypes = new Set(
    pets.filter(p => petFlags.get(p.id) === 'skin').map(p => p.petType)
  )
  const ownedCount = PET_TYPES.filter(t => ownedTypes.has(t)).length
  const missingCount = PET_TYPES.length - ownedCount

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" slotProps={{ paper: { sx: { maxHeight: '82vh' } } }}>
      <DialogTitle sx={{ pb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box component="span" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>Collections</Box>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ px: 3, borderBottom: '1px solid', borderColor: 'divider', minHeight: 36 }}
        slotProps={{ indicator: { style: { backgroundColor: '#c9a84c' } } }}
        textColor="inherit"
      >
        <Tab label="S-Grade Skills" sx={{ minHeight: 36, py: 0.5, fontSize: 12 }} />
        <Tab
          label={`Pet Collection — ${ownedCount} / ${PET_TYPES.length}`}
          sx={{ minHeight: 36, py: 0.5, fontSize: 12 }}
        />
      </Tabs>

      <DialogContent sx={{ p: 2.5 }}>

        {/* ---- Skills tab ---- */}
        {tab === 0 && (
          <Box>
            {/* Summary stats */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
              <Chip
                label={`${totalSGradeSkills} total S-grade rolls`}
                size="small"
                sx={{ bgcolor: '#ffd60022', color: '#ffd600', fontWeight: 700 }}
              />
              <Chip
                label={`${skillsWithS} skill types at S`}
                size="small"
                sx={{ bgcolor: '#66bb6a22', color: '#66bb6a', fontWeight: 700 }}
              />
              <Chip
                label={`${presentSkills.length - skillsWithS} skill types — no S yet`}
                size="small"
                variant="outlined"
                sx={{ opacity: 0.7 }}
              />
            </Box>

            {/* Skills present in roster */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {presentSkills.map(skill => (
                <Box
                  key={skill.id}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    px: 1.5, py: 0.875, borderRadius: 1,
                    bgcolor: skill.sCount > 0 ? '#66bb6a0d' : 'background.default',
                    border: '1px solid',
                    borderColor: skill.sCount > 0 ? '#66bb6a33' : 'divider',
                  }}
                >
                  <Typography sx={{ fontSize: 15, flexShrink: 0, lineHeight: 1 }}>{skill.icon}</Typography>
                  <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>{skill.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexShrink: 0 }}>
                    {skill.sCount > 0 ? (
                      <Chip
                        label={`${skill.sCount} × S`}
                        size="small"
                        sx={{ height: 18, fontSize: 10, bgcolor: '#66bb6a33', color: '#66bb6a', fontWeight: 700 }}
                      />
                    ) : (
                      <Chip
                        label="No S"
                        size="small"
                        variant="outlined"
                        sx={{ height: 18, fontSize: 10, opacity: 0.5 }}
                      />
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 48, textAlign: 'right' }}>
                      {skill.totalCount} pet{skill.totalCount !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Skills not in roster at all */}
            {absentSkills.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                  Not in roster
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {absentSkills.map(skill => (
                    <Chip
                      key={skill.id}
                      label={`${skill.icon} ${skill.name}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: 10, opacity: 0.35 }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* ---- Pet collection tab ---- */}
        {tab === 1 && (
          <Box>
            {/* Summary stats */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
              <Chip
                label={`${ownedCount} owned`}
                size="small"
                sx={{ bgcolor: '#66bb6a22', color: '#66bb6a', fontWeight: 700 }}
              />
              <Chip
                label={`${missingCount} missing`}
                size="small"
                sx={{ bgcolor: '#ef535022', color: '#ef5350', fontWeight: 700 }}
              />
            </Box>

            <Grid container spacing={1.25}>
              {PET_TYPES.map(petType => {
                const owned = ownedTypes.has(petType)
                return (
                  <Grid key={petType} size={{ xs: 6, sm: 4, md: 3 }}>
                    <Box sx={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: 0.75, p: 1.5, borderRadius: 1, textAlign: 'center',
                      border: '1px solid',
                      borderColor: owned ? '#66bb6a44' : 'divider',
                      bgcolor: owned ? '#66bb6a08' : 'background.default',
                      opacity: owned ? 1 : 0.4,
                      transition: 'opacity 0.15s',
                    }}>
                      <PetImage petType={petType} size={44} />
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 10, lineHeight: 1.3 }}>
                        {petType.replace(/_/g, ' ')}
                      </Typography>
                      {owned
                        ? <Chip label="✓ Owned" size="small" sx={{ height: 16, fontSize: 9, bgcolor: '#66bb6a33', color: '#66bb6a', fontWeight: 700 }} />
                        : <Chip label="Missing" size="small" variant="outlined" sx={{ height: 16, fontSize: 9 }} />
                      }
                    </Box>
                  </Grid>
                )
              })}
            </Grid>
          </Box>
        )}

      </DialogContent>
    </Dialog>
  )
}
