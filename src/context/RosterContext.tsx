import { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react'
import type { Pet } from '../types'
import type { RerollSuggestion } from '../utils/teamScoring'
import {
  computePetFlags, computeInvestFlags, computePetModeRecommendations, getRerollSuggestion,
} from '../utils/teamScoring'
import { TEAM_MODES } from '../data/teamModes'
import type { PetTemplate } from '../hooks/useTemplates'
import type { RuneConfig } from '../utils/runeCalc'
import { DEFAULT_RUNE_CONFIG } from '../utils/runeCalc'

// ---- Storage ----

const PETS_KEY = 'bdm_pets_v1'
const TEMPLATES_KEY = 'bdm_templates_v1'
const SETTINGS_KEY = 'bdm_settings_v1'

interface AppSettings {
  runeConfig: RuneConfig
  collectorMode: boolean
}

function loadSettings(): AppSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null')
    return {
      runeConfig: saved?.runeConfig ?? DEFAULT_RUNE_CONFIG,
      collectorMode: saved?.collectorMode ?? true,
    }
  } catch { return { runeConfig: DEFAULT_RUNE_CONFIG, collectorMode: true } }
}

function saveSettings(s: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}
const SLOT_COUNT = 5

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

function loadPets(): Pet[] {
  try { return JSON.parse(localStorage.getItem(PETS_KEY) ?? '[]') } catch { return [] }
}
function savePets(pets: Pet[]) {
  localStorage.setItem(PETS_KEY, JSON.stringify(pets))
}

function defaultTemplates(): PetTemplate[] {
  return Array.from({ length: SLOT_COUNT }, (_, i) => ({
    id: i + 1, name: `Template ${i + 1}`, petIds: [null, null, null],
  }))
}
function loadTemplates(): PetTemplate[] {
  try {
    const saved = JSON.parse(localStorage.getItem(TEMPLATES_KEY) ?? 'null')
    if (!Array.isArray(saved) || saved.length !== SLOT_COUNT) return defaultTemplates()
    return saved
  } catch { return defaultTemplates() }
}
function saveTemplates(t: PetTemplate[]) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(t))
}

// ---- Context type ----

export interface RosterContextValue {
  // Raw data
  pets: Pet[]
  templates: PetTemplate[]
  // Sync-computed (fast)
  petFlags: Map<string, 'skin' | 'fodder'>
  investFlags: Map<string, 'invest' | 'fodder_mid'>
  rerollSuggestions: Map<string, RerollSuggestion>
  petTemplateMap: Map<string, string[]>
  // Deferred-computed (heavy — O(modes × N³))
  petRecommendations: Map<string, string[]>
  isComputing: boolean
  // Settings
  runeConfig: RuneConfig
  collectorMode: boolean
  setRuneConfig: (config: RuneConfig) => void
  setCollectorMode: (enabled: boolean) => void
  // Pet mutations
  addPet: (pet: Omit<Pet, 'id' | 'createdAt'>) => void
  addPets: (pets: Omit<Pet, 'id' | 'createdAt'>[]) => void
  updatePet: (id: string, updates: Omit<Pet, 'id' | 'createdAt'>) => void
  deletePet: (id: string) => void
  exportJSON: () => void
  importJSON: (file: File, onDone?: (count: number) => void) => void
  // Template mutations
  updateTemplate: (id: number, updates: Partial<Omit<PetTemplate, 'id'>>) => void
  setTemplateSlot: (templateId: number, slot: number, petId: string | null) => void
  clearTemplate: (id: number) => void
}

const RosterContext = createContext<RosterContextValue | null>(null)

// ---- Provider ----

export function RosterProvider({ children }: { children: React.ReactNode }) {
  const [pets, setPets] = useState<Pet[]>(loadPets)
  const [templates, setTemplates] = useState<PetTemplate[]>(loadTemplates)
  const [petRecommendations, setPetRecommendations] = useState<Map<string, string[]>>(new Map())
  const [isComputing, setIsComputing] = useState(true)
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

  const setRuneConfig = useCallback((runeConfig: RuneConfig) => {
    setSettings(prev => { const next = { ...prev, runeConfig }; saveSettings(next); return next })
  }, [])

  const setCollectorMode = useCallback((collectorMode: boolean) => {
    setSettings(prev => { const next = { ...prev, collectorMode }; saveSettings(next); return next })
  }, [])

  // Fast synchronous computations — run inline with render
  const petFlags = useMemo(() => computePetFlags(pets), [pets])
  const investFlags = useMemo(() => computeInvestFlags(pets), [pets])

  const rerollSuggestions = useMemo(() => {
    const map = new Map<string, RerollSuggestion>()
    for (const pet of pets) {
      const hint = getRerollSuggestion(pet)
      if (hint) map.set(pet.id, hint)
    }
    return map
  }, [pets])

  const petTemplateMap = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const t of templates) {
      for (const petId of t.petIds) {
        if (!petId) continue
        const existing = map.get(petId) ?? []
        existing.push(t.name)
        map.set(petId, existing)
      }
    }
    return map
  }, [templates])

  // Heavy deferred computation — runs after paint so the UI never blocks
  useEffect(() => {
    setIsComputing(true)
    const handle = setTimeout(() => {
      setPetRecommendations(computePetModeRecommendations(pets, TEAM_MODES, settings.runeConfig.enabled ? settings.runeConfig : null))
      setIsComputing(false)
    }, 50)
    return () => clearTimeout(handle)
  }, [pets, settings.runeConfig])

  // Pet mutations
  const addPet = useCallback((pet: Omit<Pet, 'id' | 'createdAt'>) => {
    setPets(prev => { const next = [...prev, { ...pet, id: uuid(), createdAt: new Date().toISOString() }]; savePets(next); return next })
  }, [])

  const addPets = useCallback((incoming: Omit<Pet, 'id' | 'createdAt'>[]) => {
    setPets(prev => { const next = [...prev, ...incoming.map(p => ({ ...p, id: uuid(), createdAt: new Date().toISOString() }))]; savePets(next); return next })
  }, [])

  const updatePet = useCallback((id: string, updates: Omit<Pet, 'id' | 'createdAt'>) => {
    setPets(prev => { const next = prev.map(p => p.id === id ? { ...p, ...updates } : p); savePets(next); return next })
  }, [])

  const deletePet = useCallback((id: string) => {
    setPets(prev => { const next = prev.filter(p => p.id !== id); savePets(next); return next })
  }, [])

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(pets, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'bdm-pets.json'; a.click()
    URL.revokeObjectURL(url)
  }, [pets])

  const importJSON = useCallback((file: File, onDone?: (count: number) => void) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string) as Pet[]
        if (!Array.isArray(data)) return
        setPets(prev => { const next = [...prev, ...data.map(p => ({ ...p, id: uuid(), createdAt: new Date().toISOString() }))]; savePets(next); return next })
        onDone?.(data.length)
      } catch { /* invalid file */ }
    }
    reader.readAsText(file)
  }, [])

  // Template mutations
  const updateTemplate = useCallback((id: number, updates: Partial<Omit<PetTemplate, 'id'>>) => {
    setTemplates(prev => { const next = prev.map(t => t.id === id ? { ...t, ...updates } : t); saveTemplates(next); return next })
  }, [])

  const setTemplateSlot = useCallback((id: number, slot: number, petId: string | null) => {
    setTemplates(prev => {
      const next = prev.map(t => {
        if (t.id !== id) return t
        const petIds = [...t.petIds]; petIds[slot] = petId
        return { ...t, petIds }
      })
      saveTemplates(next); return next
    })
  }, [])

  const clearTemplate = useCallback((id: number) => {
    setTemplates(prev => { const next = prev.map(t => t.id === id ? { ...t, petIds: [null, null, null] } : t); saveTemplates(next); return next })
  }, [])

  return (
    <RosterContext.Provider value={{
      pets, templates,
      petFlags, investFlags, rerollSuggestions, petTemplateMap,
      petRecommendations, isComputing,
      runeConfig: settings.runeConfig,
      collectorMode: settings.collectorMode,
      setRuneConfig, setCollectorMode,
      addPet, addPets, updatePet, deletePet, exportJSON, importJSON,
      updateTemplate, setTemplateSlot, clearTemplate,
    }}>
      {children}
    </RosterContext.Provider>
  )
}

export function useRoster(): RosterContextValue {
  const ctx = useContext(RosterContext)
  if (!ctx) throw new Error('useRoster must be used within RosterProvider')
  return ctx
}
