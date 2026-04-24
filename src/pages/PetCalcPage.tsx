import { useState, useMemo } from 'react'
import {
  Box, Typography, TextField, Divider, Chip, Alert, InputAdornment,
  Autocomplete, Button, Snackbar,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { TIER_CONFIG, TIERS } from '../data/tiers'
import { regularSkills, allSkills, primarySpecialSkills } from '../data/useSkills'
import { getSkillRange, formatRange } from '../utils/skillLevels'
import { computePetFlags, computeInvestFlags, getRerollSuggestion } from '../utils/teamScoring'
import type { PetSkillEntry, Pet } from '../types'
import { useRoster } from '../context/RosterContext'
import { PetCard } from '../components/PetCard'
import { PET_TYPES } from '../data/petTypes'

// ---- Form state ----

interface SkillFormEntry {
  skillId: string
  level: string
  value: string
}

const emptySkill = (): SkillFormEntry => ({ skillId: '', level: '', value: '' })

interface FormState {
  name: string
  petType: string
  tier: string
  specialSkill: SkillFormEntry
  regularSkills: SkillFormEntry[]
}

function initForm(): FormState {
  const tier = 'T5'
  const numRegular = TIER_CONFIG[tier]?.regular ?? 4
  return {
    name: '',
    petType: '',
    tier,
    specialSkill: emptySkill(),
    regularSkills: Array.from({ length: numRegular }, emptySkill),
  }
}

function toEntry(f: SkillFormEntry): PetSkillEntry | null {
  if (!f.skillId || !f.level || !f.value) return null
  return { skillId: f.skillId, level: Number(f.level), value: Number(f.value) }
}

function validateForm(f: FormState): string | null {
  if (!f.tier) return 'Tier is required.'
  const cfg = TIER_CONFIG[f.tier]
  if (cfg?.special > 0) {
    const sp = toEntry(f.specialSkill)
    if (sp && (sp.level < 1 || sp.level > cfg.maxSkillLv)) return `Special skill level must be 1–${cfg.maxSkillLv}.`
    if (sp && sp.value <= 0) return 'Special skill value must be greater than 0.'
  }
  for (const rs of f.regularSkills) {
    const e = toEntry(rs)
    if (!e) continue
    const cfg2 = TIER_CONFIG[f.tier]
    if (e.level < 1 || e.level > cfg2?.maxSkillLv) return `Skill level must be 1–${cfg2?.maxSkillLv}.`
    if (e.value <= 0) return 'Skill value must be greater than 0.'
  }
  return null
}

// ---- Skill row ----

interface SkillRowProps {
  label: string
  skills: typeof regularSkills
  entry: SkillFormEntry
  maxLv: number
  excludeIds?: string[]
  onChange: (e: SkillFormEntry) => void
}

function SkillRow({ label, skills, entry, maxLv, excludeIds = [], onChange }: SkillRowProps) {
  const range = entry.skillId && entry.level
    ? getSkillRange(entry.skillId, Number(entry.level))
    : null

  const availableSkills = excludeIds.length
    ? skills.filter(s => !excludeIds.includes(s.id) || s.id === entry.skillId)
    : skills

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{label}</Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Autocomplete
          size="small"
          sx={{ minWidth: 220, flex: 2 }}
          options={availableSkills}
          getOptionLabel={s => s.name}
          value={availableSkills.find(s => s.id === entry.skillId) ?? null}
          onChange={(_e, val) => onChange({ ...entry, skillId: val?.id ?? '' })}
          filterOptions={(opts, { inputValue }) =>
            inputValue
              ? opts.filter(s => s.name.toLowerCase().includes(inputValue.toLowerCase()))
              : opts
          }
          renderOption={(props, option) => {
            const { key, ...optionProps } = props
            return (
              <Box key={key} component="li" {...optionProps} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: 16, lineHeight: 1 }}>{option.icon}</Typography>
                <Typography variant="body2">{option.name}</Typography>
              </Box>
            )
          }}
          renderInput={params => (
            <TextField
              {...params}
              label="Skill"
              placeholder="Type to search..."
              slotProps={{ ...params.slotProps,
                input: {
                  ...params.slotProps?.input,
                  startAdornment: entry.skillId ? (
                    <Typography sx={{ fontSize: 15, ml: 0.5, mr: 0.25, lineHeight: 1 }}>
                      {availableSkills.find(s => s.id === entry.skillId)?.icon
                        ?? allSkills.find(s => s.id === entry.skillId)?.icon}
                    </Typography>
                  ) : null,
                },
              }}
            />
          )}
        />
        <TextField
          label="Level"
          size="small"
          type="number"
          value={entry.level}
          onChange={e => onChange({ ...entry, level: e.target.value })}
          slotProps={{ htmlInput: { min: 1, max: maxLv } }}
          sx={{ width: 90 }}
          helperText={`Max ${maxLv}`}
        />
        <TextField
          label="Value"
          size="small"
          type="number"
          value={entry.value}
          onChange={e => onChange({ ...entry, value: e.target.value })}
          sx={{ width: 130 }}
          helperText={range ? formatRange(range.min, range.max, range.unit) : ' '}
          slotProps={range?.unit === 'percent' ? {
            input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
          } : range?.unit === 'lt' ? {
            input: { endAdornment: <InputAdornment position="end">LT</InputAdornment> },
          } : undefined}
        />
      </Box>
    </Box>
  )
}

// ---- Page ----

export function PetCalcPage() {
  const { pets, addPet, runeConfig, collectorMode } = useRoster()
  const [form, setForm] = useState<FormState>(initForm)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const tierCfg = TIER_CONFIG[form.tier]
  const hasSpecial = (tierCfg?.special ?? 0) > 0
  const usedSpecialId = form.specialSkill.skillId
  const usedRegularIds = form.regularSkills.map(r => r.skillId).filter(Boolean)

  function regularExclude(i: number): string[] {
    return [usedSpecialId, ...usedRegularIds.filter((_, j) => j !== i)].filter(Boolean)
  }

  function handleTierChange(tier: string) {
    const numRegular = TIER_CONFIG[tier]?.regular ?? 4
    setForm(prev => ({
      ...prev,
      tier,
      regularSkills: Array.from({ length: numRegular }, (_, i) => prev.regularSkills[i] ?? emptySkill()),
    }))
  }

  function updateRegular(i: number, val: SkillFormEntry) {
    setForm(prev => {
      const updated = [...prev.regularSkills]
      updated[i] = val
      return { ...prev, regularSkills: updated }
    })
  }

  function handleAddToMyPets() {
    const err = validateForm(form)
    if (err) { setError(err); return }
    if (!form.name.trim()) { setError('Pet name is required to add to My Pets.'); return }

    addPet({
      name: form.name.trim(),
      petType: form.petType.trim(),
      tier: form.tier,
      specialSkill: tierCfg?.special > 0 ? toEntry(form.specialSkill) : null,
      regularSkills: form.regularSkills.map(toEntry),
    })
    setToast(`"${form.name.trim()}" added to My Pets!`)
    setError('')
  }

  // Live preview
  const previewPet = useMemo((): Pet => ({
    id: '__calc_preview__',
    name: form.name.trim() || 'Preview Pet',
    petType: form.petType || '',
    tier: form.tier,
    specialSkill: (TIER_CONFIG[form.tier]?.special ?? 0) > 0 ? toEntry(form.specialSkill) : null,
    regularSkills: form.regularSkills.map(toEntry),
    createdAt: '',
  }), [form])

  const hasAnySkill = previewPet.specialSkill !== null || previewPet.regularSkills.some(e => e !== null)
  const hasFormData = hasAnySkill || !!form.petType

  const previewRoster = useMemo(() => [...pets, previewPet], [pets, previewPet])

  const previewPetFlag = useMemo(
    () => hasFormData ? (computePetFlags(previewRoster).get(previewPet.id) ?? null) : null,
    [hasFormData, previewRoster, previewPet.id]
  )

  const previewInvestFlag = useMemo(
    () => hasAnySkill ? (computeInvestFlags(previewRoster).get(previewPet.id) ?? null) : null,
    [hasAnySkill, previewRoster, previewPet.id]
  )

  const previewReroll = useMemo(
    () => previewInvestFlag === 'invest' ? getRerollSuggestion(previewPet) : null,
    [previewPet, previewInvestFlag]
  )

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>🧮 Pet Calc</Typography>
        <Typography variant="body2" color="text.secondary">
          Check skill roll quality and stats without adding to your collection.
        </Typography>
      </Box>


      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'flex-start' }}>

        {/* ---- Form ---- */}
        <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* Basic info */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Pet Name"
              size="small"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              sx={{ flex: 2, minWidth: 180 }}
              placeholder="e.g. Laila (optional)"
            />
            <Autocomplete
              freeSolo
              options={PET_TYPES}
              value={form.petType}
              getOptionLabel={option => option.replace(/_/g, ' ')}
              onChange={(_e, val) => setForm(p => ({ ...p, petType: val ?? '' }))}
              onInputChange={(_e, val) => setForm(p => ({ ...p, petType: val.replace(/ /g, '_') }))}
              sx={{ flex: 2, minWidth: 180 }}
              renderOption={(props, option) => {
                const { key, ...optionProps } = props
                return (
                  <Box key={key} component="li" {...optionProps} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      component="img"
                      src={`/pets/${option}_Profile.png`}
                      alt={option}
                      sx={{ width: 32, height: 32, borderRadius: 1, objectFit: 'cover', flexShrink: 0 }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                    <Typography variant="body2">{option.replace(/_/g, ' ')}</Typography>
                  </Box>
                )
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Pet Type"
                  size="small"
                  placeholder="e.g. Lucky Black Dragon"
                  helperText="Select or type to search"
                  slotProps={{
                    ...params.slotProps,
                    input: {
                      ...params.slotProps?.input,
                      startAdornment: form.petType ? (
                        <Box
                          component="img"
                          src={`/pets/${form.petType}_Profile.png`}
                          alt={form.petType}
                          sx={{ width: 24, height: 24, borderRadius: 0.5, objectFit: 'cover', mr: 0.5, flexShrink: 0 }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : null,
                    },
                  }}
                />
              )}
            />
            <Autocomplete
              size="small"
              sx={{ minWidth: 160, flex: 1 }}
              options={TIERS}
              getOptionLabel={t => TIER_CONFIG[t]?.label ?? t}
              value={form.tier}
              onChange={(_e, val) => { if (val) handleTierChange(val) }}
              disableClearable
              renderInput={params => (
                <TextField
                  {...params}
                  label="Tier"
                  placeholder="Type to search..."
                  slotProps={{ ...params.slotProps }}
                />
              )}
            />
          </Box>

          {tierCfg && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={`Max Skill Lv: ${tierCfg.maxSkillLv}`} size="small" variant="outlined" />
              <Chip label={`Pickup: ${tierCfg.cooldown}`} size="small" variant="outlined" />
            </Box>
          )}

          <Divider />

          {/* Special skill */}
          {hasSpecial && (
            <>
              <Box>
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                  ✦ SPECIAL SKILL
                </Typography>
                <SkillRow
                  label="Special Skill Slot"
                  skills={primarySpecialSkills}
                  entry={form.specialSkill}
                  maxLv={tierCfg?.maxSkillLv ?? 35}
                  excludeIds={usedRegularIds}
                  onChange={e => setForm(p => ({ ...p, specialSkill: e }))}
                />
              </Box>
              <Divider />
            </>
          )}

          {/* Regular skills */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1.5 }}>
              REGULAR SKILLS
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {form.regularSkills.map((entry, i) => (
                <SkillRow
                  key={i}
                  label={`Skill Slot ${i + 1}`}
                  skills={regularSkills}
                  entry={entry}
                  maxLv={tierCfg?.maxSkillLv ?? 10}
                  excludeIds={regularExclude(i)}
                  onChange={val => updateRegular(i, val)}
                />
              ))}
            </Box>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <Box>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddToMyPets}
            >
              Add to My Pets
            </Button>
          </Box>
        </Box>

        {/* ---- Preview ---- */}
        <Box sx={{
          flex: 1, minWidth: 260, maxWidth: { md: 340 },
          position: { md: 'sticky' }, top: { md: 80 },
        }}>
          <Typography variant="caption" sx={{
            fontWeight: 700, display: 'block', mb: 1.5,
            textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5,
          }}>
            Live Preview
          </Typography>
          <PetCard
            pet={previewPet}
            onEdit={() => {}}
            onDelete={() => {}}
            petFlag={previewPetFlag === 'fodder' && !hasAnySkill ? null : previewPetFlag}
            investFlag={previewInvestFlag}
            rerollSuggestion={previewReroll}
            collectorMode={collectorMode}
            runeConfig={runeConfig.enabled ? runeConfig : null}
            readOnly
          />
        </Box>

      </Box>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast('')}
        message={toast}
      />
    </Box>
  )
}
