import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, TextField, Divider, Chip, Alert, InputAdornment, IconButton,
  Autocomplete, Tooltip, Snackbar, Select, MenuItem,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import DownloadIcon from '@mui/icons-material/Download'
import UploadIcon from '@mui/icons-material/Upload'
import ShareIcon from '@mui/icons-material/Share'
import AssessmentIcon from '@mui/icons-material/Assessment'
import SearchIcon from '@mui/icons-material/Search'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ContentCutIcon from '@mui/icons-material/ContentCut'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { TIER_CONFIG, TIERS } from '../data/tiers'
import { specialSkills, regularSkills, allSkills, primarySpecialSkills } from '../data/useSkills'
import { getSkillRange, formatRange } from '../utils/skillLevels'
import { encodePets, decodePets } from '../utils/shareEncoder'
import { computePetFlags, computeInvestFlags, getRerollSuggestion, getPetQuality, TIER_RANK } from '../utils/teamScoring'
import type { PetSkillEntry } from '../types'
import { useRoster } from '../context/RosterContext'
import type { Pet } from '../types'
import { PetCard } from '../components/PetCard'
import { RosterSummaryModal } from '../components/RosterSummaryModal'
import { PET_TYPES } from '../data/petTypes'

const TIER_COLORS: Record<string, string> = {
  T1: '#eeeeee', T2: '#33a474', T3: '#4a8dc0', T4: '#867cae',
  T5: '#fbb753', T6: '#ea621e', T6S: '#ea621e',
  T7: '#df2222', T7S: '#df2222', T7SS: '#df2222',
}

// ---- Helpers for search/sort ----

function gradeLabel(q: number): string {
  if (q >= 0.8) return 'S'
  if (q >= 0.6) return 'A'
  if (q >= 0.4) return 'B'
  if (q >= 0.2) return 'C'
  return 'D'
}


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

function initForm(pet?: Pet): FormState {
  const tier = pet?.tier ?? 'T5'
  const numRegular = TIER_CONFIG[tier]?.regular ?? 4
  return {
    name: pet?.name ?? '',
    petType: pet?.petType ?? '',
    tier,
    specialSkill: pet?.specialSkill
      ? { skillId: pet.specialSkill.skillId, level: String(pet.specialSkill.level), value: String(pet.specialSkill.value) }
      : emptySkill(),
    regularSkills: Array.from({ length: numRegular }, (_, i) => {
      const e = pet?.regularSkills[i]
      return e ? { skillId: e.skillId, level: String(e.level), value: String(e.value) } : emptySkill()
    }),
  }
}

function toEntry(f: SkillFormEntry): PetSkillEntry | null {
  if (!f.skillId || !f.level || !f.value) return null
  return { skillId: f.skillId, level: Number(f.level), value: Number(f.value) }
}

function validateForm(f: FormState): string | null {
  if (!f.name.trim()) return 'Pet name is required.'
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

// ---- Skill entry row ----

interface SkillRowProps {
  label: string
  skills: typeof specialSkills
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

// ---- Main page ----

type SortBy = 'name' | 'petType' | 'tier' | 'rating' | 'skill'

const GRADE_ORDER: Record<string, number> = { S: 5, A: 4, B: 3, C: 2, D: 1 }

export function MyPetsPage() {
  const {
    pets,
    petFlags, investFlags, petRecommendations, rerollSuggestions, petTemplateMap,
    addPet, addPets, updatePet, deletePet, exportJSON, importJSON,
    runeConfig, collectorMode,
  } = useRoster()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Pet | null>(null)
  const [form, setForm] = useState<FormState>(initForm)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [sharedPets, setSharedPets] = useState<Omit<Pet, 'id' | 'createdAt'>[]>([])
  const importRef = useRef<HTMLInputElement>(null)

  // Search / filter / sort
  const [search, setSearch] = useState('')
  const [ratingFilter, setRatingFilter] = useState<string[]>([])
  const [tierFilter, setTierFilter] = useState<string[]>([])
  const [fodderFilter, setFodderFilter] = useState<'all' | 'fodder' | 'skin'>('all')
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // Load shared pets from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const encoded = params.get('share')
    if (encoded) {
      const decoded = decodePets(encoded)
      if (decoded.length > 0) setSharedPets(decoded)
    }
  }, [])

  // Live preview — temporary Pet built from current form state
  const previewPet = useMemo((): Pet => ({
    id: editTarget?.id ?? '__preview__',
    name: form.name.trim() || 'New Pet',
    petType: form.petType || '',
    tier: form.tier,
    specialSkill: (TIER_CONFIG[form.tier]?.special ?? 0) > 0 ? toEntry(form.specialSkill) : null,
    regularSkills: form.regularSkills.map(toEntry),
    createdAt: editTarget?.createdAt ?? '',
  }), [form, editTarget])

  const hasAnySkill = previewPet.specialSkill !== null || previewPet.regularSkills.some(e => e !== null)
  const hasFormData = hasAnySkill || !!form.petType

  const previewRoster = useMemo(
    () => editTarget
      ? pets.map(p => p.id === editTarget.id ? previewPet : p)
      : [...pets, previewPet],
    [pets, previewPet, editTarget]
  )

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

  // Filtered + sorted pets
  const displayPets = useMemo(() => {
    let result = [...pets]

    if (fodderFilter === 'fodder') result = result.filter(p => petFlags.get(p.id) === 'fodder')
    else if (fodderFilter === 'skin') result = result.filter(p => petFlags.get(p.id) === 'skin')

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.petType.toLowerCase().replace(/_/g, ' ').includes(q) ||
        [p.specialSkill, ...p.regularSkills].some(
          e => e && allSkills.find(s => s.id === e.skillId)?.name.toLowerCase().includes(q)
        )
      )
    }

    if (ratingFilter.length > 0) {
      result = result.filter(p => {
        const q = getPetQuality(p)
        if (q === null) return false
        return ratingFilter.includes(gradeLabel(q))
      })
    }

    if (tierFilter.length > 0) {
      result = result.filter(p => tierFilter.includes(p.tier))
    }

    result.sort((a, b) => {
      let cmp = 0
      if (sortBy === 'name') {
        cmp = a.name.localeCompare(b.name)
      } else if (sortBy === 'petType') {
        cmp = a.petType.localeCompare(b.petType)
      } else if (sortBy === 'tier') {
        cmp = (TIER_RANK[a.tier] ?? 0) - (TIER_RANK[b.tier] ?? 0)
      } else if (sortBy === 'rating') {
        const qa = getPetQuality(a)
        const qb = getPetQuality(b)
        const ga = qa !== null ? gradeLabel(qa) : ''
        const gb = qb !== null ? gradeLabel(qb) : ''
        cmp = (GRADE_ORDER[gb] ?? 0) - (GRADE_ORDER[ga] ?? 0)
      } else if (sortBy === 'skill') {
        const sa = [a.specialSkill, ...a.regularSkills].find(Boolean)
        const sb = [b.specialSkill, ...b.regularSkills].find(Boolean)
        const na = sa ? (allSkills.find(s => s.id === sa.skillId)?.name ?? '') : ''
        const nb = sb ? (allSkills.find(s => s.id === sb.skillId)?.name ?? '') : ''
        cmp = na.localeCompare(nb)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [pets, search, ratingFilter, tierFilter, fodderFilter, sortBy, sortDir, petFlags])

  function openAdd() {
    setEditTarget(null)
    setForm(initForm())
    setError('')
    setDialogOpen(true)
  }

  function openEdit(pet: Pet) {
    setEditTarget(pet)
    setForm(initForm(pet))
    setError('')
    setDialogOpen(true)
  }

  function handleClose() {
    setDialogOpen(false)
    setError('')
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

  function handleShare() {
    const encoded = encodePets(pets)
    const url = `${window.location.origin}${window.location.pathname}?share=${encoded}`
    navigator.clipboard.writeText(url).then(() => setToast('Share link copied to clipboard!'))
  }

  function handleImportShared() {
    addPets(sharedPets)
    setSharedPets([])
    window.history.replaceState({}, '', window.location.pathname)
    setToast(`${sharedPets.length} pet${sharedPets.length !== 1 ? 's' : ''} added to your collection`)
  }

  function handleSave() {
    const err = validateForm(form)
    if (err) { setError(err); return }

    const cfg = TIER_CONFIG[form.tier]
    const petData: Omit<Pet, 'id' | 'createdAt'> = {
      name: form.name.trim(),
      petType: form.petType.trim(),
      tier: form.tier,
      specialSkill: cfg?.special > 0 ? toEntry(form.specialSkill) : null,
      regularSkills: form.regularSkills.map(toEntry),
    }

    if (editTarget) {
      updatePet(editTarget.id, petData)
    } else {
      addPet(petData)
    }
    setDialogOpen(false)
  }

  const tierCfg = TIER_CONFIG[form.tier]
  const hasSpecial = (tierCfg?.special ?? 0) > 0

  // Compute used skill IDs for duplicate prevention
  const usedSpecialId = form.specialSkill.skillId
  const usedRegularIds = form.regularSkills.map(r => r.skillId).filter(Boolean)

  function regularExclude(i: number): string[] {
    return [usedSpecialId, ...usedRegularIds.filter((_, j) => j !== i)].filter(Boolean)
  }

  function toggleRatingFilter(grade: string) {
    setRatingFilter(prev =>
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
    )
  }

  function toggleTierFilter(tier: string) {
    setTierFilter(prev =>
      prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]
    )
  }

  const hasActiveFilters = search || ratingFilter.length > 0 || tierFilter.length > 0 || fodderFilter !== 'all'

  return (
    <Box>
      {/* Shared pets banner */}
      {sharedPets.length > 0 && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="contained" onClick={handleImportShared}>
                Import All ({sharedPets.length})
              </Button>
              <Button size="small" onClick={() => { setSharedPets([]); window.history.replaceState({}, '', window.location.pathname) }}>
                Dismiss
              </Button>
            </Box>
          }
        >
          Viewing {sharedPets.length} shared pet{sharedPets.length !== 1 ? 's' : ''} — import to add them to your collection.
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5">My Pets</Typography>
          <Typography variant="body2" color="text.secondary">
            Track your pets and rate each skill roll
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <input ref={importRef} type="file" accept=".json" hidden onChange={e => {
            const file = e.target.files?.[0]
            if (file) importJSON(file, count => setToast(`${count} pet${count !== 1 ? 's' : ''} imported`))
            e.target.value = ''
          }} />
          <Tooltip title="Import from JSON file">
            <Button variant="outlined" size="small" startIcon={<UploadIcon />} onClick={() => importRef.current?.click()}>
              Import
            </Button>
          </Tooltip>
          <Tooltip title="Export pets as JSON file">
            <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={exportJSON} disabled={pets.length === 0}>
              Export
            </Button>
          </Tooltip>
          <Tooltip title="Copy shareable link">
            <Button variant="outlined" size="small" startIcon={<ShareIcon />} onClick={handleShare} disabled={pets.length === 0}>
              Share
            </Button>
          </Tooltip>
          {collectorMode && (
            <Tooltip title="Roster summary">
              <Button variant="outlined" size="small" startIcon={<AssessmentIcon />} onClick={() => setSummaryOpen(true)} disabled={pets.length === 0}>
                Collection
              </Button>
            </Tooltip>
          )}
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openAdd}>Add Pet</Button>
        </Box>
      </Box>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast('')}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* Stats bar */}
      {pets.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip label={`${pets.length} pet${pets.length !== 1 ? 's' : ''}`} size="small" />
          {Object.entries(
            pets.reduce<Record<string, number>>((acc, p) => {
              acc[p.tier] = (acc[p.tier] ?? 0) + 1
              return acc
            }, {})
          ).sort(([a], [b]) => TIERS.indexOf(b) - TIERS.indexOf(a)).map(([tier, count]) => (
            <Chip
              key={tier}
              label={`${count}× ${TIER_CONFIG[tier]?.label ?? tier}`}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>
      )}

      {/* Filter + Sort */}
      {pets.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5 }}>

          {/* Filters row */}
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 0,
            border: '1px solid', borderColor: 'divider',
            borderRadius: 1, p: 0.75, width: '100%', flexWrap: 'wrap',
          }}>

            {/* Search */}
            <Box sx={{ px: 1, minWidth: 180, flex: 1 }}>
              <TextField
                size="small"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                variant="standard"
                sx={{ width: '100%' }}
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />,
                    disableUnderline: true,
                  },
                }}
              />
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {/* Rating */}
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', px: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mr: 0.5, whiteSpace: 'nowrap' }}>Rating</Typography>
              {['S', 'A', 'B', 'C', 'D'].map(grade => (
                <Chip
                  key={grade}
                  label={grade}
                  size="small"
                  variant={ratingFilter.includes(grade) ? 'filled' : 'outlined'}
                  onClick={() => toggleRatingFilter(grade)}
                  sx={{ cursor: 'pointer', fontWeight: 700, minWidth: 32 }}
                />
              ))}
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {/* Tier */}
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', px: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mr: 0.5, whiteSpace: 'nowrap' }}>Tier</Typography>
              {TIERS.map(tier => {
                const label = tier === 'T6S'
                  ? <span>T6<span style={{ color: '#ffd700' }}>✦</span></span>
                  : tier === 'T7S'
                  ? <span>T7<span style={{ color: '#ffd700' }}>✦</span></span>
                  : tier === 'T7SS'
                  ? <span>T7<span style={{ color: '#ffd700' }}>✦✦</span></span>
                  : tier
                return (
                  <Chip
                    key={tier}
                    label={label}
                    size="small"
                    variant={tierFilter.includes(tier) ? 'filled' : 'outlined'}
                    onClick={() => toggleTierFilter(tier)}
                    sx={{
                      cursor: 'pointer', fontWeight: 700,
                      ...(tierFilter.includes(tier) && {
                        bgcolor: (TIER_COLORS[tier] ?? '#9e9e9e') + '33',
                        color: TIER_COLORS[tier] ?? '#9e9e9e',
                      }),
                    }}
                  />
                )
              })}
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {/* Type */}
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', px: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mr: 0.5, whiteSpace: 'nowrap' }}>Type</Typography>
              <Chip
                icon={<ContentCutIcon sx={{ fontSize: 12 }} />}
                label="Fodder"
                size="small"
                variant={fodderFilter === 'fodder' ? 'filled' : 'outlined'}
                onClick={() => setFodderFilter(f => f === 'fodder' ? 'all' : 'fodder')}
                sx={{
                  cursor: 'pointer', fontWeight: 700,
                  ...(fodderFilter === 'fodder' && { bgcolor: '#ef535033', color: '#ef5350', '& .MuiChip-icon': { color: '#ef5350' } }),
                }}
              />
              {collectorMode && (
                <Chip
                  icon={<AutoAwesomeIcon sx={{ fontSize: 12 }} />}
                  label="Skin"
                  size="small"
                  variant={fodderFilter === 'skin' ? 'filled' : 'outlined'}
                  onClick={() => setFodderFilter(f => f === 'skin' ? 'all' : 'skin')}
                  sx={{
                    cursor: 'pointer', fontWeight: 700,
                    ...(fodderFilter === 'skin' && { bgcolor: '#ab47bc33', color: '#ab47bc', '& .MuiChip-icon': { color: '#ab47bc' } }),
                  }}
                />
              )}
            </Box>

            {/* Clear all — pushed to end */}
            {hasActiveFilters && (
              <>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                <Box sx={{ px: 1 }}>
                  <Chip
                    label="Clear all"
                    size="small"
                    onClick={() => { setSearch(''); setRatingFilter([]); setTierFilter([]); setFodderFilter('all') }}
                    sx={{ cursor: 'pointer', fontWeight: 700 }}
                  />
                </Box>
              </>
            )}
          </Box>

          {/* Sort row */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, flexShrink: 0 }}>
              Sort by
            </Typography>
            <Select
              size="small"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortBy)}
              sx={{ minWidth: 130 }}
            >
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="petType">Pet Type</MenuItem>
              <MenuItem value="tier">Tier</MenuItem>
              <MenuItem value="rating">Rating</MenuItem>
              <MenuItem value="skill">Skill Name</MenuItem>
            </Select>
            <Tooltip title={sortDir === 'asc' ? 'Ascending' : 'Descending'}>
              <IconButton size="small" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>
                {sortDir === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>

        </Box>
      )}

      {/* Shared pets preview */}
      {sharedPets.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="caption" color="info.main" sx={{ fontWeight: 700, display: 'block', mb: 1.5, textTransform: 'uppercase' }}>
            Shared Pets Preview
          </Typography>
          <Grid container spacing={2}>
            {sharedPets.map((pet, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <PetCard
                  pet={{ ...pet, id: String(i), createdAt: '' }}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  readOnly
                />
              </Grid>
            ))}
          </Grid>
          {pets.length > 0 && <Divider sx={{ mt: 3, mb: 1 }} />}
        </Box>
      )}

      {/* Pet grid */}
      {pets.length === 0 && sharedPets.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.disabled" sx={{ mb: 1 }}>🐾 No pets yet</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>Add your first pet to start tracking skill rolls</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={openAdd}>Add Pet</Button>
        </Box>
      ) : pets.length > 0 ? (
        <>
          {displayPets.length === 0 ? (
            <Typography variant="body2" color="text.disabled" sx={{ py: 4, textAlign: 'center' }}>
              No pets match your search or filter.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {displayPets.map(pet => (
                <Grid key={pet.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <PetCard
                    pet={pet}
                    onEdit={() => openEdit(pet)}
                    onDelete={() => { if (confirm(`Delete "${pet.name}"?`)) deletePet(pet.id) }}
                    petFlag={petFlags.get(pet.id) ?? null}
                    investFlag={investFlags.get(pet.id) ?? null}
                    recommendedFor={petRecommendations.get(pet.id) ?? []}
                    inTemplates={petTemplateMap.get(pet.id) ?? []}
                    rerollSuggestion={investFlags.get(pet.id) === 'invest' ? (rerollSuggestions.get(pet.id) ?? null) : null}
                    collectorMode={collectorMode}
                    runeConfig={runeConfig.enabled ? runeConfig : null}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      ) : null}

      {/* Roster summary modal */}
      <RosterSummaryModal
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        pets={pets}
        petFlags={petFlags}
      />

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} fullWidth maxWidth="lg">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {editTarget ? 'Edit Pet' : 'Add Pet'}
          <IconButton size="small" onClick={handleClose}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 0 }}>

          {/* ---- Form column ---- */}
          <Box sx={{ flex: 2, p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5, overflowY: 'auto' }}>

            {/* Basic info */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Pet Name"
                size="small"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                sx={{ flex: 2, minWidth: 180 }}
                placeholder="e.g. Laila"
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
                        src={`${import.meta.env.BASE_URL}pets/${option}_Profile.png`}
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
                            src={`${import.meta.env.BASE_URL}pets/${form.petType}_Profile.png`}
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
          </Box>

          {/* ---- Preview column ---- */}
          <Box sx={{
            flex: 1, minWidth: 260, maxWidth: { md: 320 },
            borderLeft: { md: '1px solid' }, borderTop: { xs: '1px solid', md: 'none' },
            borderColor: 'divider',
            p: 2, bgcolor: 'background.default',
            overflowY: 'auto',
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
              readOnly
            />
          </Box>

          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editTarget ? 'Save Changes' : 'Add Pet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
