import {
  Box, FormControl, InputLabel, Select, MenuItem, Slider,
  Typography, Paper, Chip,
} from '@mui/material'
import type { Skill, SelectedSkill } from '../types'

interface Props {
  label: string
  skills: Skill[]
  value: SelectedSkill | null
  usedIds: string[]
  onChange: (val: SelectedSkill | null) => void
}

export function SkillSelector({ label, skills, value, usedIds, onChange }: Props) {
  const available = skills.filter(s => !usedIds.includes(s.id) || s.id === value?.skill.id)

  return (
    <Paper variant="outlined" sx={{ p: 2, borderColor: value ? 'primary.main' : 'divider' }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600,  mb: 1, display: 'block'  }}>
        {label.toUpperCase()}
      </Typography>

      <FormControl fullWidth size="small">
        <InputLabel>Select Skill</InputLabel>
        <Select
          value={value?.skill.id ?? ''}
          label="Select Skill"
          onChange={(e) => {
            const skill = skills.find(s => s.id === e.target.value)
            if (skill) onChange({ skill, level: value?.level ?? 5 })
            else onChange(null)
          }}
        >
          <MenuItem value=""><em>— None —</em></MenuItem>
          {available.map(s => (
            <MenuItem key={s.id} value={s.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <span>{s.icon}</span>
                <span>{s.name}</span>
                <Chip label={s.category} size="small" sx={{ ml: 'auto', fontSize: 10, height: 18 }} />
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {value && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Level {value.level} — {value.skill.levels[value.level - 1]}
          </Typography>
          <Slider
            min={1} max={5} step={1} value={value.level} marks
            onChange={(_, v) => onChange({ ...value, level: v as number })}
            sx={{ color: 'primary.main' }}
          />
          <Typography variant="caption" color="text.disabled">
            {value.skill.description}
          </Typography>
        </Box>
      )}
    </Paper>
  )
}
