import { Box, Typography } from '@mui/material'

export const RUNE_TIERS = [
  { name: 'Normal',   bonus: 1,  color: '#eeeeee' },
  { name: 'Magic',    bonus: 2,  color: '#33a474' },
  { name: 'Rare',     bonus: 3,  color: '#4a8dc0' },
  { name: 'Unique',   bonus: 4,  color: '#867cae' },
  { name: 'Epic',     bonus: 5,  color: '#fbb753' },
  { name: 'Mystical', bonus: 7,  color: '#ea621e' },
  { name: 'Abyssal',  bonus: 10, color: '#df2222', canEnhance: true, maxEnhancement: 5 },
  { name: 'Primal',   bonus: 15, color: '#f540c4', canEnhance: true, maxEnhancement: 20 },
  { name: 'Chaos',    bonus: 18, color: '#92abeb', canEnhance: true, maxEnhancement: 30 },
]

interface Props {
  tierName: string
  enhancement?: number
  size?: number
}

export function RuneIcon({ tierName, enhancement = 0, size = 48 }: Props) {
  const tier = RUNE_TIERS.find(t => t.name === tierName) ?? RUNE_TIERS[0]
  const color = tier.color

  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <Box sx={{
        width: size,
        height: size,
        borderRadius: `${size * 0.18}px`,
        overflow: 'hidden',
        border: `2px solid ${color}`,
        position: 'relative',
        bgcolor: '#0d0a10',
      }}>
        {/* Rune image */}
        <Box
          component="img"
          src={`${import.meta.env.BASE_URL}rune-companionship.svg`}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            filter: `brightness(2.5) drop-shadow(0 0 ${size * 0.06}px ${color}) drop-shadow(0 0 ${size * 0.12}px ${color}88)`,
          }}
        />

        {/* Tier color tint */}
        <Box sx={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 40%, ${color}33 0%, transparent 70%)`,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }} />
      </Box>

      {/* Enhancement badge */}
      {enhancement > 0 && (
        <Box sx={{
          position: 'absolute', top: -4, right: -4,
          bgcolor: '#111114', border: `1.5px solid ${color}`,
          borderRadius: '6px', px: 0.5, minWidth: 18, height: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Typography sx={{ fontSize: 9, fontWeight: 800, color, lineHeight: 1 }}>
            +{enhancement}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
