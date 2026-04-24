import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Box, Typography, Slider, Button, Tooltip,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { RUNE_TIERS, RuneIcon } from './RuneIcon'
import { getRuneLevelBonus } from '../utils/runeCalc'
import type { RuneConfig } from '../utils/runeCalc'

interface Props {
  open: boolean
  onClose: () => void
  runeConfig: RuneConfig
  onChange: (config: RuneConfig) => void
  onDisable: () => void
}

export function RuneSettingsModal({ open, onClose, runeConfig, onChange, onDisable }: Props) {
  const selectedTier = RUNE_TIERS.find(t => t.name === runeConfig.tierName) ?? RUNE_TIERS[0]
  const { primary, secondary } = getRuneLevelBonus({ ...runeConfig, enabled: true })

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RuneIcon tierName={runeConfig.tierName} enhancement={runeConfig.enhancement} size={28} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Rune of Companionship</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2.5 }}>

        {/* Tier picker */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
            Rune Tier
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {RUNE_TIERS.map(tier => (
              <Tooltip key={tier.name} title={
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>{tier.name}</Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>Primary: +{tier.bonus} skill levels</Typography>
                  {tier.canEnhance && <Typography variant="caption" sx={{ display: 'block' }}>Max enhancement: +{tier.maxEnhancement}</Typography>}
                </Box>
              }>
                <Box
                  onClick={() => onChange({
                    ...runeConfig,
                    tierName: tier.name,
                    enhancement: tier.canEnhance
                      ? Math.min(runeConfig.enhancement, tier.maxEnhancement ?? 0)
                      : 0,
                  })}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: '10px',
                    outline: runeConfig.tierName === tier.name
                      ? `2px solid ${tier.color}`
                      : '2px solid transparent',
                    outlineOffset: 2,
                    transition: 'outline 0.1s',
                  }}
                >
                  <RuneIcon tierName={tier.name} size={44} />
                </Box>
              </Tooltip>
            ))}
          </Box>
          <Typography variant="caption" sx={{ color: selectedTier.color, fontWeight: 700, mt: 0.75, display: 'block' }}>
            {selectedTier.name} — Primary: +{selectedTier.bonus} skill levels
          </Typography>
        </Box>

        {/* Enhancement slider */}
        {selectedTier.canEnhance && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Enhancement Level
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: selectedTier.color }}>
                +{runeConfig.enhancement}
              </Typography>
            </Box>
            <Slider
              value={runeConfig.enhancement}
              min={0}
              max={selectedTier.maxEnhancement ?? 20}
              step={1}
              onChange={(_, val) => onChange({ ...runeConfig, enhancement: val as number })}
              sx={{
                color: selectedTier.color,
                '& .MuiSlider-thumb': { width: 16, height: 16 },
              }}
              marks={[
                { value: 0, label: '+0' },
                { value: selectedTier.maxEnhancement ?? 20, label: `+${selectedTier.maxEnhancement ?? 20}` },
              ]}
            />
          </Box>
        )}

        {/* Buff summary */}
        <Box sx={{
          p: 1.5, borderRadius: 1,
          bgcolor: `${selectedTier.color}11`,
          border: `1px solid ${selectedTier.color}44`,
        }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: selectedTier.color, display: 'block', mb: 0.5 }}>
            Active Buff
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              Primary: <strong style={{ color: selectedTier.color }}>+{primary} levels</strong>
            </Typography>
            {secondary > 0 && (
              <Typography variant="caption" color="text.secondary">
                Secondary: <strong style={{ color: selectedTier.color }}>+{secondary} levels</strong>
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              Total: <strong style={{ color: selectedTier.color }}>+{primary + secondary} levels</strong>
            </Typography>
          </Box>
        </Box>

      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
        <Button size="small" color="error" onClick={onDisable}>
          Disable Rune
        </Button>
        <Button size="small" variant="contained" onClick={onClose}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  )
}
