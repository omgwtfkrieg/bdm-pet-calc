import { Box, Paper, Typography, Chip, Divider, IconButton, Tooltip } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import StarIcon from '@mui/icons-material/Star'
import ContentCutIcon from '@mui/icons-material/ContentCut'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import type { Pet } from '../types'
import type { RerollSuggestion } from '../utils/teamScoring'
import { TIER_CONFIG } from '../data/tiers'
import { allSkills } from '../data/useSkills'
import { getRollQuality, getSpecialSkillSecondary, formatSkillValue, getSkillRange } from '../utils/skillLevels'
import type { SkillUnit } from '../utils/skillLevels'
import { TEAM_MODES } from '../data/teamModes'
import { PetImage } from './PetImage'
import { RollQualityBadge } from './RollQualityBadge'
import type { RuneConfig } from '../utils/runeCalc'
import { getEffectiveSkillLevel, getRuneLevelBonus } from '../utils/runeCalc'
import { RuneIcon } from './RuneIcon'

function getSkillName(id: string): string {
  return allSkills.find(s => s.id === id)?.name ?? id
}

function getSkillIcon(id: string): string {
  return allSkills.find(s => s.id === id)?.icon ?? '❓'
}

function overallQuality(pet: Pet): number | null {
  const entries = [
    ...(pet.specialSkill ? [pet.specialSkill] : []),
    ...pet.regularSkills.filter(Boolean),
  ] as NonNullable<Pet['specialSkill']>[]

  if (entries.length === 0) return null
  const qualities = entries
    .map(e => getRollQuality(e.skillId, e.level, e.value))
    .filter((q): q is number => q !== null)
  if (qualities.length === 0) return null
  return qualities.reduce((a, b) => a + b, 0) / qualities.length
}

function gradeFromQuality(q: number): { grade: string; color: string } {
  if (q >= 0.8)  return { grade: 'S', color: '#ffd600' }
  if (q >= 0.6)  return { grade: 'A', color: '#66bb6a' }
  if (q >= 0.4)  return { grade: 'B', color: '#42a5f5' }
  if (q >= 0.2)  return { grade: 'C', color: '#ff9800' }
  return { grade: 'D', color: '#ef5350' }
}

const TIER_COLORS: Record<string, string> = {
  T1: '#eeeeee', T2: '#33a474', T3: '#4a8dc0', T4: '#867cae',
  T5: '#fbb753', T6: '#ea621e', T6S: '#ea621e',
  T7: '#df2222', T7S: '#df2222', T7SS: '#df2222',
}

interface Props {
  pet: Pet
  onEdit: () => void
  onDelete: () => void
  petFlag?: 'skin' | 'fodder' | null
  investFlag?: 'invest' | 'fodder_mid' | null
  recommendedFor?: string[]
  inTemplates?: string[]
  rerollSuggestion?: RerollSuggestion | null
  readOnly?: boolean
  collectorMode?: boolean
  runeConfig?: RuneConfig | null
}

export function PetCard({ pet, onEdit, onDelete, petFlag = null, investFlag = null, recommendedFor = [], inTemplates = [], rerollSuggestion = null, readOnly = false, collectorMode = true, runeConfig = null }: Props) {
  const tierCfg = TIER_CONFIG[pet.tier]
  const quality = overallQuality(pet)
  const tierColor = TIER_COLORS[pet.tier] ?? '#9e9e9e'

  const allEntries = [
    ...(pet.specialSkill ? [{ entry: pet.specialSkill, isSpecial: true }] : []),
    ...pet.regularSkills.filter(Boolean).map(e => ({ entry: e!, isSpecial: false })),
  ]

  const showInvest = collectorMode && investFlag === 'invest'
  const showFodderMid = collectorMode && investFlag === 'fodder_mid' && petFlag !== 'skin'
  const showAnyFodder = collectorMode && (petFlag === 'fodder' || showFodderMid)
  const showSkin = collectorMode && petFlag === 'skin'

  const borderColor = showSkin
    ? '#ab47bc44'
    : showAnyFodder
      ? '#ef535044'
      : showInvest
        ? '#26c6da44'
        : quality !== null ? (gradeFromQuality(quality).color + '44') : 'divider'

  const hoverBorderColor = showSkin
    ? '#ab47bc'
    : showAnyFodder
      ? '#ef5350'
      : showInvest
        ? '#26c6da'
        : quality !== null ? gradeFromQuality(quality).color : 'primary.main'

  return (
    <Paper variant="outlined" sx={{
      p: 2,
      borderColor,
      '&:hover': { borderColor: hoverBorderColor },
      transition: 'border-color 0.15s',
      opacity: showAnyFodder ? 0.72 : 1,
    }}>
      {/* Status chips */}
      {(showSkin || showInvest || showAnyFodder || inTemplates.length > 0 || runeConfig?.enabled) && (
        <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
          {runeConfig?.enabled && (
            <Chip
              icon={<RuneIcon tierName={runeConfig.tierName} size={12} />}
              label="Rune in effect"
              size="small"
              sx={{ height: 18, fontSize: 10, bgcolor: '#26c6da22', color: '#26c6da', fontWeight: 700, '& .MuiChip-icon': { color: '#26c6da' } }}
            />
          )}
          {showSkin && (
            <Chip
              icon={<AutoAwesomeIcon sx={{ fontSize: 12 }} />}
              label="Unique Skin"
              size="small"
              sx={{ height: 18, fontSize: 10, bgcolor: '#ab47bc22', color: '#ab47bc', fontWeight: 700, '& .MuiChip-icon': { color: '#ab47bc' } }}
            />
          )}
          {showInvest && (
            <Chip
              icon={<TrendingUpIcon sx={{ fontSize: 12 }} />}
              label="Invest"
              size="small"
              sx={{ height: 18, fontSize: 10, bgcolor: '#66bb6a22', color: '#66bb6a', fontWeight: 700, '& .MuiChip-icon': { color: '#66bb6a' } }}
            />
          )}
          {showAnyFodder && (
            <Tooltip title={
              petFlag === 'fodder'
                ? `A higher-ranked ${pet.petType.replace(/_/g, ' ')} exists in your roster — safe to use as upgrade material.`
                : 'This mid-tier pet has low roster value compared to its peers — consider using it as upgrade material.'
            }>
              <Chip
                icon={<ContentCutIcon sx={{ fontSize: 12 }} />}
                label="Fodder"
                size="small"
                sx={{ height: 18, fontSize: 10, bgcolor: '#ef535022', color: '#ef5350', fontWeight: 700, '& .MuiChip-icon': { color: '#ef5350' } }}
              />
            </Tooltip>
          )}
          {inTemplates.length > 0 && (
            <Tooltip title={`In build: ${inTemplates.join(', ')}`}>
              <Chip
                icon={<BookmarkIcon sx={{ fontSize: 12 }} />}
                label={`In Build${inTemplates.length > 1 ? ` ×${inTemplates.length}` : ''}`}
                size="small"
                sx={{ height: 18, fontSize: 10, bgcolor: '#ffa72622', color: '#ffa726', fontWeight: 700, '& .MuiChip-icon': { color: '#ffa726' } }}
              />
            </Tooltip>
          )}
        </Box>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
        <PetImage petType={pet.petType} size={60} tierColor={TIER_COLORS[pet.tier]} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>{pet.name}</Typography>
            {quality !== null && (
              <Box sx={{
                width: 22, height: 22, borderRadius: '50%',
                border: `1.5px solid ${gradeFromQuality(quality).color}`,
                bgcolor: `${gradeFromQuality(quality).color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 900, color: gradeFromQuality(quality).color, flexShrink: 0,
              }}>
                {gradeFromQuality(quality).grade}
              </Box>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary">{pet.petType.replace(/_/g, ' ')}</Typography>
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              label={
                (tierCfg?.label ?? pet.tier).includes('✦')
                  ? <span>{(tierCfg?.label ?? pet.tier).replace(/✦/g, '').trimEnd()} <span style={{ color: '#ffd700' }}>{'✦'.repeat((tierCfg?.label ?? pet.tier).split('✦').length - 1)}</span></span>
                  : (tierCfg?.label ?? pet.tier)
              }
              size="small"
              sx={{ height: 18, fontSize: 10, bgcolor: tierColor + '33', color: tierColor, fontWeight: 700 }}
            />
            <Chip
              label={`Max Lv ${tierCfg?.maxSkillLv ?? '?'}`}
              size="small"
              sx={{ height: 18, fontSize: 10 }}
            />
          </Box>
        </Box>
        {!readOnly && (
          <Box sx={{ display: 'flex', gap: 0 }}>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={onEdit}><EditIcon sx={{ fontSize: 14 }} /></IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={onDelete} color="error"><DeleteIcon sx={{ fontSize: 14 }} /></IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      <Divider sx={{ mb: 1.5 }} />

      {/* Skills */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {allEntries.map(({ entry, isSpecial }, i) => {
          const runeActive = isSpecial && !!runeConfig?.enabled
          const { primary: runePrimary, secondary: runeSecondary } = runeActive
            ? getRuneLevelBonus(runeConfig!)
            : { primary: 0, secondary: 0 }
          const { effectivePrimary, effectiveSecondary } = runeActive
            ? getEffectiveSkillLevel(entry.level, runeConfig!)
            : { effectivePrimary: entry.level, effectiveSecondary: entry.level }
          const effectiveLv = runeActive ? effectiveSecondary : undefined

          const secondary = isSpecial
            ? getSpecialSkillSecondary(entry.skillId, pet.tier, entry.level, effectiveLv)
            : null
          const secondaryBase = (isSpecial && runeActive && secondary)
            ? getSpecialSkillSecondary(entry.skillId, pet.tier, entry.level)
            : null

          const primaryRangeTotal = runeActive ? getSkillRange(entry.skillId, effectivePrimary) : null
          const primaryRangeBase  = runeActive ? getSkillRange(entry.skillId, Math.min(entry.level, 25)) : null

          const fmtBase = (v: number, unit: SkillUnit) => {
            const r = Math.round(v * 100) / 100
            if (unit === 'percent') return `${r}%`
            if (unit === 'lt') return `${r} LT`
            return `${r}`
          }

          return (
            <Box key={i}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                <Typography sx={{ fontSize: 14 }}>{getSkillIcon(entry.skillId)}</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, flex: 1 }}>
                  {getSkillName(entry.skillId)}
                </Typography>
                {isSpecial && <StarIcon sx={{ fontSize: 12, color: 'primary.main' }} />}
              </Box>

              <RollQualityBadge
                skillId={entry.skillId}
                level={entry.level}
                value={entry.value}
                skillName={getSkillName(entry.skillId)}
              />

              {/* Primary stat with rune breakdown */}
              {runeActive && primaryRangeTotal && primaryRangeBase && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <Typography sx={{ fontSize: 10, color: 'text.secondary', lineHeight: 1.4 }}>
                    {'Max '}
                    <strong style={{ color: '#e0e0e0' }}>{getSkillName(entry.skillId)}: </strong>
                    <strong style={{ color: '#c9a84c' }}>{formatSkillValue(primaryRangeTotal.max, primaryRangeTotal.unit)}</strong>
                    <span style={{ opacity: 0.55 }}>(</span>
                    <span style={{ opacity: 0.7 }}>{fmtBase(primaryRangeBase.max, primaryRangeBase.unit)}</span>
                    {' '}
                    <strong style={{ color: '#26c6da' }}>{formatSkillValue(primaryRangeTotal.max - primaryRangeBase.max, primaryRangeTotal.unit)}</strong>
                    <span style={{ opacity: 0.55 }}>)</span>
                  </Typography>
                </Box>
              )}

              {/* Secondary Added Effect */}
              {secondary && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <Typography sx={{ fontSize: 10, color: 'text.secondary', lineHeight: 1.4 }}>
                    {'Added Effect: '}
                    <strong style={{ color: '#e0e0e0' }}>{getSkillName(secondary.skillId)}: </strong>
                    <strong style={{ color: '#c9a84c' }}>{formatSkillValue(secondary.value, secondary.unit)}</strong>
                    {runeActive && secondaryBase && (
                      <>
                        <span style={{ opacity: 0.55 }}>(</span>
                        <span style={{ opacity: 0.7 }}>{fmtBase(secondaryBase.value, secondary.unit)}</span>
                        {' '}
                        <strong style={{ color: '#26c6da' }}>{formatSkillValue(Math.round((secondary.value - secondaryBase.value) * 10000) / 10000, secondary.unit)}</strong>
                        <span style={{ opacity: 0.55 }}>)</span>
                      </>
                    )}
                  </Typography>
                </Box>
              )}
            </Box>
          )
        })}
        {allEntries.length === 0 && (
          <Typography variant="caption" color="text.disabled">No skills entered</Typography>
        )}
      </Box>

      {/* Reroll suggestion */}
      {rerollSuggestion && (
        <>
          <Divider sx={{ my: 1.25 }} />
          <Box sx={{
            display: 'flex', alignItems: 'flex-start', gap: 1,
            p: 1, borderRadius: 1,
            bgcolor: '#7c4dff11', border: '1px solid #7c4dff33',
          }}>
            <AutoFixHighIcon sx={{ fontSize: 14, color: '#7c4dff', mt: 0.2, flexShrink: 0 }} />
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#7c4dff', display: 'block', lineHeight: 1.4 }}>
                Reroll Tip
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                Reroll{' '}
                <strong>{getSkillName(rerollSuggestion.skillId)}</strong>
                {' '}({gradeFromQuality(rerollSuggestion.currentQuality).grade}-grade)
                {' '}—{' '}
                any <strong style={{ color: '#7c4dff' }}>{rerollSuggestion.minGradeNeeded}+ roll</strong> pushes overall to S
              </Typography>
            </Box>
          </Box>
        </>
      )}

      {/* Mode recommendations */}
      {recommendedFor.length > 0 && (
        <>
          <Divider sx={{ my: 1.25 }} />
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {recommendedFor.map(modeId => {
              const mode = TEAM_MODES.find(m => m.id === modeId)
              if (!mode) return null
              return (
                <Tooltip key={modeId} title={mode.name}>
                  <Chip
                    label={`${mode.icon} ${mode.name}`}
                    size="small"
                    sx={{ height: 18, fontSize: 10, fontWeight: 600 }}
                  />
                </Tooltip>
              )
            })}
          </Box>
        </>
      )}
    </Paper>
  )
}
