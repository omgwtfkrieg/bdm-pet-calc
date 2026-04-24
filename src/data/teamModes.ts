export interface TeamMode {
  id: string
  name: string
  icon: string
  category: 'combat' | 'lifeskill'
  description: string
  weights: Record<string, number>  // skillId → relevance weight (1–10)
}

export const TEAM_MODES: TeamMode[] = [
  // ---- Combat ----
  {
    id: 'leveling',
    name: 'Leveling',
    icon: '⬆️',
    category: 'combat',
    description: 'Maximise Combat EXP gain while grinding mobs',
    weights: {
      field_combat_exp:  10,
      sp_monster_dmg:     4,
      sp_ap:              4,
      sp_crit_dmg:        3,
      sp_dp:              2,
      sp_branch_dmg:      2,
      sp_crit_rate:       2,
      inventory:          2,
    },
  },
  {
    id: 'grinding',
    name: 'Grinding / AFK',
    icon: '🗡️',
    category: 'combat',
    description: 'Auto-battle farming — more kills = more item drops',
    weights: {
      ex_field_drop_rate: 10,
      field_combat_exp:    6,
      sp_ap:               5,
      sp_monster_dmg:      4,
      sp_dp:               3,
      inventory:           3,
      sp_crit_dmg:         3,
      sp_branch_dmg:       2,
      sp_crit_rate:        2,
    },
  },
  {
    id: 'boss',
    name: 'Boss Rush',
    icon: '👹',
    category: 'combat',
    description: 'Boss rush content',
    weights: {
      sp_boss_dmg:   10,
      sp_ap:          7,
      sp_crit_dmg:    6,
      sp_crit_rate:   5,
      sp_dp:          4,
      sp_branch_dmg:  3,
      inventory:      2,
    },
  },
  {
    id: 'world_boss',
    name: 'World Boss',
    icon: '🌍',
    category: 'combat',
    description: 'Open-world scheduled field bosses',
    weights: {
      sp_boss_dmg: 10,
    },
  },

  {
    id: 'pvp',
    name: 'PvP',
    icon: '⚔️',
    category: 'combat',
    description: 'Player vs Player combat',
    weights: {
      sp_pvp_dmg:   10,
      sp_ap:         7,
      sp_crit_dmg:   6,
      sp_crit_rate:  5,
      sp_dp:         5,
      sp_max_hp:     4,
      sp_branch_dmg: 3,
    },
  },

  // ---- Life Skills ----
  {
    id: 'logging',
    name: 'Logging',
    icon: '🪵',
    category: 'lifeskill',
    description: 'Maximise Logging EXP gain',
    weights: { logging_exp: 10 },
  },
  {
    id: 'mining',
    name: 'Mining',
    icon: '⛏️',
    category: 'lifeskill',
    description: 'Maximise Mining EXP gain',
    weights: { mining_exp: 10 },
  },
  {
    id: 'foraging',
    name: 'Foraging',
    icon: '🌾',
    category: 'lifeskill',
    description: 'Maximise Foraging EXP gain',
    weights: { foraging_exp: 10 },
  },
  {
    id: 'fishing',
    name: 'Fishing',
    icon: '🎣',
    category: 'lifeskill',
    description: 'Maximise Fishing EXP gain',
    weights: { fishing_exp: 10 },
  },
  {
    id: 'knowledge',
    name: 'Knowledge',
    icon: '📖',
    category: 'lifeskill',
    description: 'Maximise Knowledge Acquire Rate',
    weights: {
      knowledge_rate:     10,
      field_combat_exp:    5,
      ex_field_drop_rate:  4,
      sp_ap:               4,
      inventory:           3,
      sp_monster_dmg:      3,
      sp_dp:               3,
      sp_crit_dmg:         3,
      sp_branch_dmg:       2,
      sp_crit_rate:        2,
    },
  },
  {
    id: 'dark_energy',
    name: 'Dark Energy',
    icon: '🌑',
    category: 'lifeskill',
    description: 'Maximise Dark Energy EXP from dismantling materials',
    weights: { dark_energy_exp: 10 },
  },
]
