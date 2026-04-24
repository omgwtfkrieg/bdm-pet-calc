import { useState, useMemo } from 'react'
import {
  Box, Typography, Paper, Chip, Tabs, Tab, Autocomplete, TextField,
  IconButton, Tooltip, Divider, Button,
} from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import AddIcon from '@mui/icons-material/Add'
import StarIcon from '@mui/icons-material/Star'
import { useRoster } from '../context/RosterContext'
import { TEAM_MODES } from '../data/teamModes'
import { findBestTeam, scoreTeam, getPetQuality, computeTopBySkill } from '../utils/teamScoring'
import type { TeamMode } from '../data/teamModes'
import { PetImage } from '../components/PetImage'
import { RollQualityBadge } from '../components/RollQualityBadge'
import { TIER_CONFIG } from '../data/tiers'
import { allSkills } from '../data/useSkills'
import type { Pet } from '../types'

const TIER_COLORS: Record<string, string> = {
  T1: '#eeeeee', T2: '#33a474', T3: '#4a8dc0', T4: '#867cae',
  T5: '#fbb753', T6: '#ea621e', T6S: '#ea621e',
  T7: '#df2222', T7S: '#df2222', T7SS: '#df2222',
}


function PetMiniCard({ pet }: { pet: Pet }) {
  const tierColor = TIER_COLORS[pet.tier] ?? '#9e9e9e'

  const allEntries = [
    ...(pet.specialSkill ? [{ entry: pet.specialSkill, isSpecial: true }] : []),
    ...pet.regularSkills.filter(Boolean).map(e => ({ entry: e!, isSpecial: false })),
  ]

  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', gap: 1, p: 1.25,
      bgcolor: 'background.default', borderRadius: 1,
      border: '1px solid', borderColor: 'divider',
    }}>
      {/* Pet info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PetImage petType={pet.petType} size={36} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }} noWrap>{pet.name}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: 10 }} noWrap>
            {pet.petType.replace(/_/g, ' ')}
          </Typography>
          <Chip
            label={TIER_CONFIG[pet.tier]?.label ?? pet.tier}
            size="small"
            sx={{ height: 14, fontSize: 9, bgcolor: tierColor + '33', color: tierColor, mt: 0.25 }}
          />
        </Box>
      </Box>

      {/* Skills */}
      {allEntries.length > 0 && (
        <>
          <Divider />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {allEntries.map(({ entry, isSpecial }, i) => {
              const skill = allSkills.find(s => s.id === entry.skillId)
              return (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography sx={{ fontSize: 13, lineHeight: 1, flexShrink: 0 }}>
                    {skill?.icon ?? '❓'}
                  </Typography>
                  <Typography variant="caption" sx={{ flex: 1, fontSize: 10, lineHeight: 1.3 }} noWrap>
                    {skill?.name ?? entry.skillId}
                  </Typography>
                  {isSpecial && (
                    <StarIcon sx={{ fontSize: 10, color: 'primary.main', flexShrink: 0 }} />
                  )}
                  <RollQualityBadge
                    skillId={entry.skillId}
                    level={entry.level}
                    value={entry.value}
                    skillName={skill?.name ?? entry.skillId}
                    compact
                  />
                </Box>
              )
            })}
          </Box>
        </>
      )}
    </Box>
  )
}

function EmptySlot() {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: 68, borderRadius: 1, border: '1px dashed', borderColor: 'divider',
    }}>
      <Typography variant="caption" color="text.disabled">Empty</Typography>
    </Box>
  )
}

interface PetPickerProps {
  value: Pet | null
  options: Pet[]
  label: string
  onChange: (pet: Pet | null) => void
  activeModeId: string
  petRecommendations: Map<string, string[]>
}

function PetPicker({ value, options, label, onChange, activeModeId, petRecommendations }: PetPickerProps) {
  const isRecommended = (p: Pet) => petRecommendations.get(p.id)?.includes(activeModeId) ?? false

  const sorted = [...options].sort((a, b) => {
    const ra = isRecommended(a) ? 1 : 0
    const rb = isRecommended(b) ? 1 : 0
    if (rb !== ra) return rb - ra
    return (getPetQuality(b) ?? 0) - (getPetQuality(a) ?? 0)
  })

  return (
    <Autocomplete
      size="small"
      options={sorted}
      getOptionLabel={p => p.name}
      value={value}
      onChange={(_, val) => onChange(val)}
      renderOption={(props, p) => {
        const { key, ...optionProps } = props
        const recommended = isRecommended(p)
        return (
          <Box key={p.id} component="li" {...optionProps} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PetImage petType={p.petType} size={28} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" noWrap sx={{ flex: 1 }}>{p.name}</Typography>
                {recommended && (
                  <Chip
                    label="✦ Pick"
                    size="small"
                    sx={{ height: 16, fontSize: 10, fontWeight: 800, bgcolor: '#ffd60022', color: '#ffd600' }}
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {TIER_CONFIG[p.tier]?.label ?? p.tier} · {p.petType.replace(/_/g, ' ')}
              </Typography>
            </Box>
          </Box>
        )
      }}
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          size="small"
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps?.input,
              startAdornment: value ? (
                <Box sx={{ mr: 0.5, flexShrink: 0 }}>
                  <PetImage petType={value.petType} size={20} />
                </Box>
              ) : null,
            },
          }}
        />
      )}
    />
  )
}

const combatModes = TEAM_MODES.filter(m => m.category === 'combat')
const lifeModes = TEAM_MODES.filter(m => m.category === 'lifeskill')


export function TeamBuilderPage() {
  const { pets, templates, updateTemplate, setTemplateSlot, clearTemplate, petRecommendations, runeConfig } = useRoster()
  const [categoryTab, setCategoryTab] = useState(0)
  const [selectedCombatId, setSelectedCombatId] = useState(combatModes[0].id)
  const [selectedLifeId, setSelectedLifeId] = useState(lifeModes[0].id)

  const activeMode = useMemo((): TeamMode => {
    if (categoryTab === 1) return lifeModes.find(m => m.id === selectedLifeId) ?? lifeModes[0]
    return combatModes.find(m => m.id === selectedCombatId) ?? combatModes[0]
  }, [categoryTab, selectedCombatId, selectedLifeId])

  const rune = runeConfig.enabled ? runeConfig : null
  const topBySkill = useMemo(() => computeTopBySkill(pets, rune), [pets, rune])
  const suggestedTeam = useMemo(() => findBestTeam(pets, activeMode.id, rune), [pets, activeMode, rune])
  const suggestedScore = useMemo(() => scoreTeam(suggestedTeam, activeMode.id, topBySkill, rune), [suggestedTeam, activeMode, topBySkill, rune])

  function fillTemplate(templateId: number) {
    const petIds = [
      suggestedTeam[0]?.id ?? null,
      suggestedTeam[1]?.id ?? null,
      suggestedTeam[2]?.id ?? null,
    ]
    updateTemplate(templateId, { petIds })
  }

  if (pets.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.disabled" sx={{ mb: 1 }}>🐾 No pets in roster</Typography>
        <Typography variant="body2" color="text.disabled">
          Add pets in My Pets first to use the Team Builder
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5">Team Builder</Typography>
        <Typography variant="body2" color="text.secondary">
          Auto-suggested 3-pet teams per game mode · Save up to 5 templates
        </Typography>
      </Box>

      {/* ---- Suggested Teams ---- */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Suggested Teams</Typography>

        {/* Category tabs */}
        <Tabs
          value={categoryTab}
          onChange={(_, v) => setCategoryTab(v)}
          sx={{ mb: 1.5, minHeight: 32 }}
          slotProps={{ indicator: { style: { backgroundColor: '#c9a84c' } } }}
          textColor="inherit"
        >
          <Tab label="Combat" sx={{ minHeight: 32, py: 0.5, fontSize: 12 }} />
          <Tab label="Life Skills" sx={{ minHeight: 32, py: 0.5, fontSize: 12 }} />
        </Tabs>

        {/* Mode chips */}
        {categoryTab === 0 ? (
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
            {combatModes.map(mode => (
              <Chip
                key={mode.id}
                label={`${mode.icon} ${mode.name}`}
                size="small"
                variant={selectedCombatId === mode.id ? 'filled' : 'outlined'}
                onClick={() => setSelectedCombatId(mode.id)}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
            ))}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
            {lifeModes.map(mode => (
              <Chip
                key={mode.id}
                label={`${mode.icon} ${mode.name}`}
                size="small"
                variant={selectedLifeId === mode.id ? 'filled' : 'outlined'}
                onClick={() => setSelectedLifeId(mode.id)}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
            ))}
          </Box>
        )}
        {categoryTab === 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            {`Scoring pets for ${activeMode.name}`}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Suggested team */}
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              {activeMode.description}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 1 }}>
              {Array.from({ length: 3 }, (_, i) =>
                suggestedTeam[i]
                  ? <PetMiniCard key={suggestedTeam[i].id} pet={suggestedTeam[i]} />
                  : <EmptySlot key={i} />
              )}
            </Box>
            {suggestedTeam.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                Team score: <strong>{suggestedScore.toFixed(1)}</strong>
              </Typography>
            )}
          </Box>

          {/* Save suggestion to template */}
          <Box sx={{ minWidth: 160 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
              Save suggestion to
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {templates.map(t => (
                <Button
                  key={t.id}
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                  onClick={() => fillTemplate(t.id)}
                  sx={{ fontSize: 11, py: 0.5, justifyContent: 'flex-start' }}
                  disabled={suggestedTeam.length === 0}
                >
                  {t.name}
                </Button>
              ))}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* ---- My Templates ---- */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>My Templates</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {templates.map(template => {
          const templatePets = template.petIds.map(id => pets.find(p => p.id === id) ?? null)
          const filledPets = templatePets.filter(Boolean) as Pet[]
          const teamScore = filledPets.length > 0 ? scoreTeam(filledPets, activeMode.id, topBySkill, rune) : 0

          // For each slot, exclude pets already in other slots of this template
          function slotOptions(slot: number): Pet[] {
            const otherIds = new Set(
              template.petIds.filter((id, i) => i !== slot && id !== null)
            )
            return pets.filter(p => !otherIds.has(p.id))
          }

          return (
            <Paper key={template.id} variant="outlined" sx={{ p: 2 }}>
              {/* Template header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <TextField
                  size="small"
                  value={template.name}
                  onChange={e => updateTemplate(template.id, { name: e.target.value })}
                  sx={{ maxWidth: 200 }}
                  slotProps={{ htmlInput: { style: { fontWeight: 700 } } }}
                />
                <Chip
                  label={`${activeMode.icon} ${teamScore.toFixed(1)}`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: 11 }}
                />
                <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Fill from current suggestion">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => fillTemplate(template.id)}
                        disabled={suggestedTeam.length === 0}
                      >
                        <AutoFixHighIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Clear all slots">
                    <IconButton size="small" onClick={() => clearTemplate(template.id)}>
                      <ClearIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* 3 pet slots */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
                {Array.from({ length: 3 }, (_, slot) => (
                  <Box key={slot}>
                    {templatePets[slot] && (
                      <PetMiniCard pet={templatePets[slot]!} />
                    )}
                    <Box sx={{ mt: templatePets[slot] ? 0.75 : 0 }}>
                      <PetPicker
                        label={`Pet ${slot + 1}`}
                        value={templatePets[slot]}
                        options={slotOptions(slot)}
                        onChange={val => setTemplateSlot(template.id, slot, val?.id ?? null)}
                        activeModeId={activeMode.id}
                        petRecommendations={petRecommendations}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          )
        })}
      </Box>
    </Box>
  )
}
