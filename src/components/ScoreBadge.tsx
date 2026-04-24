import { Box, Tooltip } from '@mui/material'
import { getScoreLabel } from '../utils/rating'

interface Props {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { width: 28, height: 28, fontSize: 13 },
  md: { width: 40, height: 40, fontSize: 18 },
  lg: { width: 56, height: 56, fontSize: 26 },
}

export function ScoreBadge({ score, size = 'md' }: Props) {
  const { label, color } = getScoreLabel(score)
  const { width, height, fontSize } = sizes[size]

  return (
    <Tooltip title={`Score: ${score}/10`}>
      <Box
        sx={{
          width,
          height,
          borderRadius: '50%',
          border: `2px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize,
          fontWeight: 900,
          color,
          bgcolor: `${color}22`,
          flexShrink: 0,
        }}
      >
        {label}
      </Box>
    </Tooltip>
  )
}
