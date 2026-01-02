import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Color, UserPalette } from '@/types'
import {
  loadPalette,
  savePalette,
  getDefaultPalette,
  clearPalette as clearStorage,
} from '@/services/paletteStorage'
import { validatePalette } from '@/utils/paletteValidation'

interface PaletteContextType {
  palette: UserPalette
  addColor: (color: Color) => void
  updateColor: (id: string, color: Color) => void
  removeColor: (id: string) => void
  clearPalette: () => void
  resetToDefault: () => void
  validation: ReturnType<typeof validatePalette>
}

const PaletteContext = createContext<PaletteContextType | undefined>(undefined)

export function usePaletteContext() {
  const context = useContext(PaletteContext)
  if (context === undefined) {
    throw new Error('usePaletteContext must be used within a PaletteProvider')
  }
  return context
}

interface PaletteProviderProps {
  children: ReactNode
}

export function PaletteProvider({ children }: PaletteProviderProps) {
  const [palette, setPalette] = useState<UserPalette>(() => {
    // Загружаем палитру из localStorage или используем дефолтную
    const saved = loadPalette()
    if (saved && saved.colors.length > 0) {
      return saved
    }
    return getDefaultPalette()
  })

  // Сохраняем палитру в localStorage при изменении
  useEffect(() => {
    savePalette(palette)
  }, [palette])

  const addColor = (color: Color) => {
    setPalette((prev) => ({
      colors: [...prev.colors, color],
    }))
  }

  const updateColor = (id: string, updatedColor: Color) => {
    setPalette((prev) => ({
      colors: prev.colors.map((color) =>
        color.id === id ? updatedColor : color
      ),
    }))
  }

  const removeColor = (id: string) => {
    setPalette((prev) => ({
      colors: prev.colors.filter((color) => color.id !== id),
    }))
  }

  const clearPalette = () => {
    setPalette({ colors: [] })
    clearStorage()
  }

  const resetToDefault = () => {
    const defaultPalette = getDefaultPalette()
    setPalette(defaultPalette)
    savePalette(defaultPalette)
  }

  const validation = validatePalette(palette)

  const value: PaletteContextType = {
    palette,
    addColor,
    updateColor,
    removeColor,
    clearPalette,
    resetToDefault,
    validation,
  }

  return (
    <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>
  )
}

