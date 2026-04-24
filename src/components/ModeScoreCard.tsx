import { Box, Paper, Typography, LinearProgress } from '@mui/material'
import type { GameMode } from '../types'
import { getScoreLabel } from '../utils/rating'

interface Props {
  mode: GameMode
  score: number
  active?: boolean
  onClick?: () => void
}

export function ModeScoreCard({ mode, score, active, onClick }: Props) {
  const { label, color } = getScoreLabel(score)

  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 1.5,
        cursor: onClick ? 'pointer' : 'default',
        borderColor: active ? 'primary.main' : 'divider',
        bgcolor: active ? 'rgba(201,168,76,0.05)' : 'background.paper',
        transition: 'all 0.15s',
        '&:hover': onClick ? { borderColor: 'primary.main', bgcolor: 'rgba(201,168,76,0.05)' } : {},
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <span style={{ fontSize: 16 }}>{mode.icon}</span>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>{mode.name}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 900, color }}>{label}</Typography>
          <Typography variant="caption" color="text.secondary">({score})</Typography>
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={score * 10}
        sx={{
          height: 4,
          borderRadius: 2,
          bgcolor: 'rgba(255,255,255,0.08)',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 },
        }}
      />
    </Paper>
  )
}
