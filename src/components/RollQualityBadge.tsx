import { Box, Tooltip, Typography, LinearProgress } from '@mui/material'
import { getRollQuality, getSkillRange, formatRange, formatSkillValue } from '../utils/skillLevels'

interface Props {
  skillId: string
  level: number
  value: number
  skillName: string
  compact?: boolean
}

function gradeFromQuality(q: number): { grade: string; color: string } {
  if (q >= 0.8)  return { grade: 'S', color: '#ffd600' }
  if (q >= 0.6)  return { grade: 'A', color: '#66bb6a' }
  if (q >= 0.4)  return { grade: 'B', color: '#42a5f5' }
  if (q >= 0.2)  return { grade: 'C', color: '#ff9800' }
  return { grade: 'D', color: '#ef5350' }
}

export function RollQualityBadge({ skillId, level, value, skillName, compact = false }: Props) {
  const quality = getRollQuality(skillId, level, value)
  const range = getSkillRange(skillId, level)

  if (quality === null || range === null) return null

  const { grade, color } = gradeFromQuality(quality)
  const pct = Math.round(quality * 100)

  const tooltip = (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="caption" sx={{ fontWeight: 700 }}>{skillName} — Lv {level}</Typography><br />
      <Typography variant="caption">Your value: {formatSkillValue(value, range.unit)}</Typography><br />
      <Typography variant="caption" color="text.secondary">Range: {formatRange(range.min, range.max, range.unit)}</Typography><br />
      <Typography variant="caption" color="text.secondary">Roll quality: {pct}% ({grade})</Typography>
    </Box>
  )

  if (compact) {
    return (
      <Tooltip title={tooltip}>
        <Box sx={{
          width: 22, height: 22, borderRadius: '50%',
          border: `1.5px solid ${color}`, bgcolor: `${color}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 900, color, cursor: 'default', flexShrink: 0,
        }}>
          {grade}
        </Box>
      </Tooltip>
    )
  }

  return (
    <Tooltip title={tooltip}>
      <Box sx={{ width: '100%', cursor: 'default' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
            Lv {level} · {formatSkillValue(value, range.unit)}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color, fontSize: 11 }}>
            {grade} ({pct}%)
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            height: 4, borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.08)',
            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 },
          }}
        />
      </Box>
    </Tooltip>
  )
}
