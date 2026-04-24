import { useState, useCallback } from 'react'

const STORAGE_KEY = 'bdm_templates_v1'
const SLOT_COUNT = 5

export interface PetTemplate {
  id: number
  name: string
  petIds: (string | null)[]  // always 3 slots
}

function defaultTemplates(): PetTemplate[] {
  return Array.from({ length: SLOT_COUNT }, (_, i) => ({
    id: i + 1,
    name: `Template ${i + 1}`,
    petIds: [null, null, null],
  }))
}

function load(): PetTemplate[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (!Array.isArray(saved) || saved.length !== SLOT_COUNT) return defaultTemplates()
    return saved
  } catch {
    return defaultTemplates()
  }
}

function save(templates: PetTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

export function useTemplates() {
  const [templates, setTemplates] = useState<PetTemplate[]>(load)

  const updateTemplate = useCallback((id: number, updates: Partial<Omit<PetTemplate, 'id'>>) => {
    setTemplates(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...updates } : t)
      save(next)
      return next
    })
  }, [])

  const setTemplateSlot = useCallback((id: number, slot: number, petId: string | null) => {
    setTemplates(prev => {
      const next = prev.map(t => {
        if (t.id !== id) return t
        const petIds = [...t.petIds]
        petIds[slot] = petId
        return { ...t, petIds }
      })
      save(next)
      return next
    })
  }, [])

  const clearTemplate = useCallback((id: number) => {
    setTemplates(prev => {
      const next = prev.map(t => t.id === id ? { ...t, petIds: [null, null, null] } : t)
      save(next)
      return next
    })
  }, [])

  return { templates, updateTemplate, setTemplateSlot, clearTemplate }
}
