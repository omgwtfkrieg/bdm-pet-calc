import { useState, useEffect } from 'react'
import { Box } from '@mui/material'
import PetsIcon from '@mui/icons-material/Pets'

interface Props {
  petType: string
  size?: number
  tierColor?: string
}

export function PetImage({ petType, size = 72, tierColor }: Props) {
  const [failed, setFailed] = useState(false)
  const src = `/pets/${petType}_Profile.png`

  useEffect(() => { setFailed(false) }, [petType])

  const ringStyle = tierColor
    ? { boxShadow: `0 0 0 2px ${tierColor}, 0 0 8px 1px ${tierColor}44` }
    : {}

  if (!petType || failed) {
    return (
      <Box sx={{
        width: size, height: size, borderRadius: '50%',
        bgcolor: 'rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: tierColor ? `2px solid ${tierColor}` : '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
        ...ringStyle,
      }}>
        <PetsIcon sx={{ fontSize: size * 0.45, color: 'text.disabled' }} />
      </Box>
    )
  }

  return (
    <Box
      component="img"
      src={src}
      alt={petType}
      onError={() => setFailed(true)}
      sx={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, ...ringStyle }}
    />
  )
}
