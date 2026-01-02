import type { Color, UserPalette } from '@/types'
import { calculateColorDistance } from './colorOperations'

const MIN_COLORS = 2
const DUPLICATE_THRESHOLD = 5 // Минимальное расстояние в RGB для считания цветов разными

/**
 * Проверка минимального количества цветов в палитре
 */
export function validateMinColors(palette: UserPalette): {
  isValid: boolean
  message?: string
} {
  if (palette.colors.length < MIN_COLORS) {
    return {
      isValid: false,
      message: `В палитре должно быть минимум ${MIN_COLORS} цвета`,
    }
  }
  return { isValid: true }
}

/**
 * Проверка уникальности цветов в палитре
 * Два цвета считаются одинаковыми, если расстояние между ними < порога
 */
export function validateUniqueColors(palette: UserPalette): {
  isValid: boolean
  duplicates: Array<{ color1: Color; color2: Color; distance: number }>
  message?: string
} {
  const duplicates: Array<{ color1: Color; color2: Color; distance: number }> =
    []

  for (let i = 0; i < palette.colors.length; i++) {
    for (let j = i + 1; j < palette.colors.length; j++) {
      const color1 = palette.colors[i]
      const color2 = palette.colors[j]
      const distance = calculateColorDistance(color1.rgb, color2.rgb)

      if (distance < DUPLICATE_THRESHOLD) {
        duplicates.push({ color1, color2, distance })
      }
    }
  }

  if (duplicates.length > 0) {
    return {
      isValid: false,
      duplicates,
      message: `Найдены похожие цвета в палитре (расстояние < ${DUPLICATE_THRESHOLD})`,
    }
  }

  return { isValid: true, duplicates: [] }
}

/**
 * Полная валидация палитры
 */
export function validatePalette(palette: UserPalette): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Проверка минимального количества
  const minColorsCheck = validateMinColors(palette)
  if (!minColorsCheck.isValid) {
    errors.push(minColorsCheck.message || 'Недостаточно цветов в палитре')
  }

  // Проверка уникальности
  const uniqueCheck = validateUniqueColors(palette)
  if (!uniqueCheck.isValid) {
    uniqueCheck.duplicates.forEach((dup) => {
      warnings.push(
        `Похожие цвета: ${dup.color1.name || dup.color1.hex} и ${
          dup.color2.name || dup.color2.hex
        } (расстояние: ${dup.distance.toFixed(1)})`
      )
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

