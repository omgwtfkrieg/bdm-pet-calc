import { useState, useCallback } from 'react'
import type { Pet } from '../types'

const STORAGE_KEY = 'bdm_pets_v1'

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  // Fallback for non-secure contexts (plain HTTP on LAN)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

function load(): Pet[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function save(pets: Pet[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pets))
}

export function usePets() {
  const [pets, setPets] = useState<Pet[]>(load)

  const addPet = useCallback((pet: Omit<Pet, 'id' | 'createdAt'>) => {
    const newPet: Pet = { ...pet, id: uuid(), createdAt: new Date().toISOString() }
    setPets(prev => {
      const next = [...prev, newPet]
      save(next)
      return next
    })
  }, [])

  const addPets = useCallback((incoming: Omit<Pet, 'id' | 'createdAt'>[]) => {
    setPets(prev => {
      const next = [
        ...prev,
        ...incoming.map(p => ({ ...p, id: uuid(), createdAt: new Date().toISOString() })),
      ]
      save(next)
      return next
    })
  }, [])

  const updatePet = useCallback((id: string, updates: Omit<Pet, 'id' | 'createdAt'>) => {
    setPets(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates } : p)
      save(next)
      return next
    })
  }, [])

  const deletePet = useCallback((id: string) => {
    setPets(prev => {
      const next = prev.filter(p => p.id !== id)
      save(next)
      return next
    })
  }, [])

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(pets, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bdm-pets.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [pets])

  const importJSON = useCallback((file: File, onDone?: (count: number) => void) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string) as Pet[]
        if (!Array.isArray(data)) return
        setPets(prev => {
          const next = [
            ...prev,
            ...data.map(p => ({ ...p, id: uuid(), createdAt: new Date().toISOString() })),
          ]
          save(next)
          return next
        })
        onDone?.(data.length)
      } catch { /* invalid file */ }
    }
    reader.readAsText(file)
  }, [])

  return { pets, addPet, addPets, updatePet, deletePet, exportJSON, importJSON }
}
