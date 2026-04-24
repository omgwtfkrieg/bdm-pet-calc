# 🐾 BDM Pet Calculator

An unofficial fan-made pet management and team-building tool for **Black Desert Mobile**.

🔗 **Live site:** https://omgwtfkrieg.github.io/bdm-pet-calc/

---

## Features

### 🧮 Pet Calc
Calculate skill roll quality before adding a pet to your roster. Enter a pet's tier, special skill, and regular skills to get an instant live preview with quality grades (S / A / B / C / D), investment flags, reroll suggestions, and skin/fodder analysis — all without committing the pet to your collection.

### 🐾 My Pets
Manage your full pet roster with:
- **Skill quality badges** — normalized roll grades per skill and tier
- **Skin / Fodder flags** — per pet type, identifies the best keeper and low-value duplicates
- **Invest flags** — highlights mid-tier pets worth leveling (unique skills, best-in-roster, reroll candidates)
- **Reroll suggestions** — identifies the single regular skill slot that, if replaced, could push a pet to S overall
- **Mode recommendation chips** — shows which game modes each pet is relevant for
- **Collector Mode** — toggles skin/fodder visibility for collection-focused players
- **Import / Export / Share** — JSON export, JSON import, and shareable roster URL

### ⚔️ Team Builder
Suggests optimal 3-pet teams per game mode using roster-wide value analysis:
- **Combat modes:** Leveling, Grinding/AFK, Boss Rush, World Boss, PVP
- **Life skill modes:** Logging, Mining, Foraging, Fishing, Dark Energy, Knowledge
- Primary skills fill all 3 slots; combo pets (primary + secondary) are preferred
- Non-stacking skills (Field Item Drop Rate) are never double-stacked in a team
- Save up to 5 custom team templates with editable names and manual slot overrides

### 💎 Rune of Companionship
Apply your Rune of Companionship's level buff to all special skill calculations:
- Supports all tiers from Normal to Chaos with enhancement levels
- Rune-adjusted values shown inline on pet cards and used in team scoring

---

## Game Modes & Recommendation Logic

| Mode | Primary Skill | Combo Bonus |
|---|---|---|
| Leveling | Field Combat EXP | AP, DP, Monster DMG |
| Grinding / AFK | Field Item Drop Rate · AP · DP · Monster DMG | Field Combat EXP |
| Boss Rush | Extra Damage to Bosses | AP, DP, Crit DMG, Crit Rate, Max HP, Branch DMG |
| World Boss | Extra Damage to World Bosses | AP, DP, Crit DMG, Crit Rate, Max HP, Branch DMG |
| PVP | Damage to Adventurers · Decrease Damage from Adventurers | AP, DP, Crit DMG, Crit Rate, Max HP, Branch DMG |
| Knowledge | Knowledge Acquire Rate | AP, DP, Field Combat EXP, Monster DMG |
| Life Skills | Respective EXP skill | — |

Recommendations rank pets by **absolute skill value** (not roll quality tier), with rune level buff applied. Combo pets (primary + secondary skills) receive a preference bonus in team suggestions.

---

## Disclaimer

This is an **unofficial fan-made tool** not affiliated with, endorsed by, or connected to Pearl Abyss. Skill formulas and game mechanics are based on community research and may not always reflect the latest game updates.

**Use at your own risk.** Recommendations are data-driven suggestions — always use your own judgment before sacrificing or modifying pets.

---

## Feedback & Bug Reports

Found a bug or have a suggestion? [Submit feedback here](https://docs.google.com/forms/d/e/1FAIpQLSdaGYx2qQIfWOfWBae9BWxEbXdJI_1_yPFCEk76ivC23IysEA/viewform?usp=publish-editor)

---

## Tech Stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [MUI (Material UI v6)](https://mui.com/)
- Deployed via [GitHub Pages](https://pages.github.com/) with GitHub Actions

## Running Locally

```bash
npm install
npm run dev
```

## Support

If this tool has been useful, consider buying me a taco ☕ [ko-fi.com/P5P51Y54CP](https://ko-fi.com/P5P51Y54CP)
