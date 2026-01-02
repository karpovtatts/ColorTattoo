import { createContext, useContext, useState, ReactNode } from 'react'
import type { Color, RGB, HSL } from '@/types'
import {
  createColorFromHex,
  createColorFromRgb,
  createColorFromHsl,
} from '@/utils/colorOperations'
import { validateHex, validateRgb, validateHsl } from '@/utils/colorConversions'

interface ColorContextType {
  targetColor: Color | null
  setTargetColor: (color: Color | null) => void
  setTargetColorFromHex: (hex: string) => void
  setTargetColorFromRgb: (rgb: RGB) => void
  setTargetColorFromHsl: (hsl: HSL) => void
  clearTargetColor: () => void
}

const ColorContext = createContext<ColorContextType | undefined>(undefined)

export function useColorContext() {
  const context = useContext(ColorContext)
  if (context === undefined) {
    throw new Error('useColorContext must be used within a ColorProvider')
  }
  return context
}

interface ColorProviderProps {
  children: ReactNode
}

export function ColorProvider({ children }: ColorProviderProps) {
  const [targetColor, setTargetColor] = useState<Color | null>(null)

  const setTargetColorFromHex = (hex: string) => {
    try {
      if (!validateHex(hex)) {
        throw new Error('Invalid HEX color')
      }
      const color = createColorFromHex(hex)
      setTargetColor(color)
    } catch (error) {
      console.error('Error setting color from HEX:', error)
      throw error
    }
  }

  const setTargetColorFromRgb = (rgb: RGB) => {
    try {
      if (!validateRgb(rgb)) {
        throw new Error('Invalid RGB color')
      }
      const color = createColorFromRgb(rgb)
      setTargetColor(color)
    } catch (error) {
      console.error('Error setting color from RGB:', error)
      throw error
    }
  }

  const setTargetColorFromHsl = (hsl: HSL) => {
    try {
      if (!validateHsl(hsl)) {
        throw new Error('Invalid HSL color')
      }
      const color = createColorFromHsl(hsl)
      setTargetColor(color)
    } catch (error) {
      console.error('Error setting color from HSL:', error)
      throw error
    }
  }

  const clearTargetColor = () => {
    setTargetColor(null)
  }

  const value: ColorContextType = {
    targetColor,
    setTargetColor,
    setTargetColorFromHex,
    setTargetColorFromRgb,
    setTargetColorFromHsl,
    clearTargetColor,
  }

  return <ColorContext.Provider value={value}>{children}</ColorContext.Provider>
}

