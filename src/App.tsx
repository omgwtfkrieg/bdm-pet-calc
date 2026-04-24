import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation, Navigate, useNavigate } from 'react-router-dom'
import {
  ThemeProvider, CssBaseline, Box, AppBar, Toolbar, Typography, Tabs, Tab,
  Container, LinearProgress, Fade, Button, Tooltip, FormControlLabel, Switch,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Collapse, Alert,
  Drawer, List, ListItem, ListItemButton, ListItemText, Divider, useMediaQuery,
} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import MenuIcon from '@mui/icons-material/Menu'
import { useTheme } from '@mui/material/styles'
import { theme } from './theme'
import { MyPetsPage } from './pages/MyPetsPage'
import { TeamBuilderPage } from './pages/TeamBuilderPage'
import { PetCalcPage } from './pages/PetCalcPage'
import { RosterProvider, useRoster } from './context/RosterContext'
import { RuneSettingsModal } from './components/RuneSettingsModal'
import { RUNE_TIERS } from './components/RuneIcon'

const NAV = [
  { label: '🧮 Pet Calc', path: '/' },
  { label: '🐾 My Pets', path: '/my-pets' },
  { label: '⚔️ Team Builder', path: '/team-builder' },
]

function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const tabIndex = Math.max(0, NAV.findIndex(n => n.path === location.pathname))
  const { isComputing, runeConfig, collectorMode, setRuneConfig, setCollectorMode } = useRoster()
  const [runeModalOpen, setRuneModalOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(() => localStorage.getItem('bdm_disclaimer_seen') !== '1')

  const muiTheme = useTheme()
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'))

  const activeTier = RUNE_TIERS.find(t => t.name === runeConfig.tierName)

  function handleRuneToggle(enabled: boolean) {
    if (enabled) {
      setRuneConfig({ ...runeConfig, enabled: true })
      setTimeout(() => setRuneModalOpen(true), 0)
    } else {
      setRuneConfig({ ...runeConfig, enabled: false })
    }
  }

  const runeLabel = runeConfig.enabled
    ? `${runeConfig.tierName}${runeConfig.enhancement > 0 ? ` +${runeConfig.enhancement}` : ''}`
    : 'Rune'

  // Shared toggles used in both desktop AppBar and mobile Drawer
  const CollectorToggle = (
    <FormControlLabel
      control={
        <Switch
          checked={collectorMode}
          onChange={e => setCollectorMode(e.target.checked)}
          size="small"
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': { color: '#ab47bc' },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#ab47bc' },
          }}
        />
      }
      label={<Typography sx={{ fontSize: 12, fontWeight: 600, color: collectorMode ? '#ab47bc' : 'text.disabled' }}>Collector</Typography>}
      sx={{ mx: 0 }}
    />
  )

  const RuneToggle = (
    <FormControlLabel
      control={
        <Switch
          checked={runeConfig.enabled}
          onChange={e => handleRuneToggle(e.target.checked)}
          size="small"
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': { color: activeTier?.color ?? '#26c6da' },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: activeTier?.color ?? '#26c6da' },
          }}
        />
      }
      label={
        <Typography
          sx={{ fontSize: 12, fontWeight: 600, color: runeConfig.enabled ? activeTier?.color : 'text.disabled', cursor: runeConfig.enabled ? 'pointer' : 'default', '&:hover': runeConfig.enabled ? { textDecoration: 'underline' } : {} }}
          onClick={runeConfig.enabled ? e => { e.preventDefault(); setRuneModalOpen(true) } : undefined}
        >
          {runeLabel}
        </Typography>
      }
      sx={{ mx: 0 }}
    />
  )

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0} sx={{
        bgcolor: '#111114cc',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <Toolbar sx={{ minHeight: { xs: 56, md: 64 } }}>
          {/* Logo — always visible */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: { xs: 'auto', md: 4 } }}>
            <Box
              component="img"
              src={`${import.meta.env.BASE_URL}favicon.svg`}
              alt="BDM Pet Calculator"
              sx={{ width: 28, height: 28, flexShrink: 0 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: 1 }}>
              BDM
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Pet Calculator
            </Typography>
          </Box>

          {/* Desktop nav tabs */}
          <Tabs
            value={tabIndex}
            textColor="inherit"
            slotProps={{ indicator: { style: { backgroundColor: '#c9a84c' } } }}
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            {NAV.map(n => (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <Tab key={n.path} label={n.label} component={NavLink as any} to={n.path}
                sx={{ fontWeight: 600, fontSize: 13, minWidth: 'auto', px: 2 }}
              />
            ))}
          </Tabs>

          <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />

          {/* Desktop controls */}
          <Tooltip title="Collector Mode — shows Unique Skin and Fodder flags on pet cards">
            <Box sx={{ display: { xs: 'none', md: 'flex' } }}>{CollectorToggle}</Box>
          </Tooltip>

          <Tooltip title={runeConfig.enabled
            ? `Rune active (${runeLabel}) — click label to configure`
            : "Rune of Companionship — apply your rune's level buff to special skill calculations"
          }>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }}>{RuneToggle}</Box>
          </Tooltip>

          <Tooltip title="About & Disclaimer">
            <IconButton size="small" onClick={() => setInfoOpen(true)} sx={{ mr: 1, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
              <InfoOutlinedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          <Button
            href="https://ko-fi.com/P5P51Y54CP"
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            size="small"
            sx={{
              display: { xs: 'none', md: 'inline-flex' },
              borderColor: '#72a4f2', color: '#72a4f2', fontWeight: 700, fontSize: 12,
              textTransform: 'none', whiteSpace: 'nowrap',
              '&:hover': { borderColor: '#90b8ff', color: '#90b8ff', bgcolor: '#72a4f211' },
            }}
          >
            🌮 Buy me a taco
          </Button>

          {/* Mobile hamburger */}
          <IconButton
            size="small"
            onClick={() => setDrawerOpen(true)}
            sx={{ display: { xs: 'flex', md: 'none' }, color: 'text.secondary' }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>

        <Fade in={isComputing} unmountOnExit>
          <LinearProgress sx={{ height: 2, bgcolor: 'transparent', '& .MuiLinearProgress-bar': { bgcolor: '#c9a84c' } }} />
        </Fade>
      </AppBar>

      {/* Mobile nav drawer */}
      <Drawer anchor="right" open={drawerOpen && isMobile} onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { sx: { width: 260, bgcolor: '#111114', borderLeft: '1px solid rgba(255,255,255,0.08)' } } }}
      >
        <Box sx={{ pt: 2, pb: 1, px: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1 }}>
            BDM Pet Calculator
          </Typography>
        </Box>
        <Divider />
        <List disablePadding>
          {NAV.map(n => (
            <ListItem key={n.path} disablePadding>
              <ListItemButton
                selected={location.pathname === n.path}
                onClick={() => { navigate(n.path); setDrawerOpen(false) }}
                sx={{ '&.Mui-selected': { bgcolor: 'rgba(201,168,76,0.12)', color: '#c9a84c' } }}
              >
                <ListItemText primary={n.label} slotProps={{ primary: { style: { fontSize: 14, fontWeight: 600 } } }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <Box sx={{ px: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {CollectorToggle}
          {RuneToggle}
        </Box>
        <Divider />
        <Box sx={{ px: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            href="https://ko-fi.com/P5P51Y54CP"
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            size="small"
            fullWidth
            sx={{ borderColor: '#72a4f2', color: '#72a4f2', fontWeight: 700, fontSize: 12, textTransform: 'none' }}
          >
            🌮 Buy me a taco
          </Button>
          <Button
            size="small"
            variant="text"
            fullWidth
            startIcon={<InfoOutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={() => { setInfoOpen(true); setDrawerOpen(false) }}
            sx={{ color: 'text.secondary', fontSize: 12, textTransform: 'none' }}
          >
            About & Disclaimer
          </Button>
        </Box>
      </Drawer>

      <Collapse in={bannerVisible} unmountOnExit>
        <Alert
          severity="warning"
          onClose={() => { setBannerVisible(false); localStorage.setItem('bdm_disclaimer_seen', '1') }}
          sx={{ borderRadius: 0, borderBottom: '1px solid', borderColor: 'divider', fontSize: 13 }}
        >
          <strong>Unofficial fan tool — not affiliated with Pearl Abyss.</strong> Recommendations are data-driven suggestions only. Always use your own judgment before sacrificing or modifying pets.
        </Alert>
      </Collapse>

      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 }, px: { xs: 1.5, md: 3 } }}>
        <Routes>
          <Route path="/" element={<PetCalcPage />} />
          <Route path="/my-pets" element={<MyPetsPage />} />
          <Route path="/team-builder" element={<TeamBuilderPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>

      <RuneSettingsModal
        open={runeModalOpen}
        onClose={() => setRuneModalOpen(false)}
        runeConfig={runeConfig}
        onChange={setRuneConfig}
        onDisable={() => { setRuneConfig({ ...runeConfig, enabled: false }); setRuneModalOpen(false) }}
      />

      <Dialog open={infoOpen} onClose={() => setInfoOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>About this tool</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="body2">
            This is an unofficial fan-made calculator for <strong>Black Desert Mobile</strong>. It is not affiliated with, endorsed by, or connected to Pearl Abyss.
          </Typography>
          <Typography variant="body2">
            Skill ranges, formulas, and game mechanics are based on community research and may not always reflect the latest game updates.
          </Typography>
          <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 600 }}>
            ⚠️ Use this tool at your own risk.
          </Typography>
          <Typography variant="body2">
            Team and mode recommendations are data-driven suggestions — they may not always represent the optimal choice for your playstyle. <strong>Always use your own judgment before sacrificing, foddering, or modifying pets.</strong> Irreversible actions cannot be undone.
          </Typography>
          <Button
            href="https://docs.google.com/forms/d/e/1FAIpQLSdaGYx2qQIfWOfWBae9BWxEbXdJI_1_yPFCEk76ivC23IysEA/viewform?usp=publish-editor"
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            size="small"
            fullWidth
            sx={{ mt: 0.5, textTransform: 'none', fontWeight: 600 }}
          >
            🐛 Report a bug / Leave feedback
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoOpen(false)} size="small">Got it</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RosterProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Layout />
        </BrowserRouter>
      </RosterProvider>
    </ThemeProvider>
  )
}
