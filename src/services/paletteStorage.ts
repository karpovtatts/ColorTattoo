import type { UserPalette, Color } from '@/types'
import { createColorFromHex } from '@/utils/colorOperations'

const STORAGE_KEY = 'userPalette'

/**
 * Сохранение палитры в localStorage
 */
export function savePalette(palette: UserPalette): void {
  try {
    const serialized = JSON.stringify(palette)
    localStorage.setItem(STORAGE_KEY, serialized)
  } catch (error) {
    console.error('Error saving palette to localStorage:', error)
    throw new Error('Не удалось сохранить палитру')
  }
}

/**
 * Загрузка палитры из localStorage
 */
export function loadPalette(): UserPalette | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY)
    if (!serialized) {
      return null
    }

    const data = JSON.parse(serialized) as UserPalette
    
    return { colors: data.colors }
  } catch (error) {
    console.error('Error loading palette from localStorage:', error)
    return null
  }
}

/**
 * Получение предустановленной базовой палитры
 */
export function getDefaultPalette(): UserPalette {
  const defaultColors: Color[] = [
    // Базовые хроматические цвета
    createColorFromHex('#FF0000', 'red-1', 'Красный'),
    createColorFromHex('#0000FF', 'blue-1', 'Синий'),
    createColorFromHex('#FFFF00', 'yellow-1', 'Жёлтый'),
    // Маджента как отдельный базовый канал для фиолетов/сиреневых
    createColorFromHex('#FF00FF', 'magenta-1', 'Маджента'),
    // Акроматические для разбавления/затемнения
    createColorFromHex('#FFFFFF', 'white-1', 'Белый'),
    createColorFromHex('#000000', 'black-1', 'Чёрный'),
  ]

  return {
    colors: defaultColors,
  }
}

/**
 * Очистка палитры из localStorage
 */
export function clearPalette(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing palette from localStorage:', error)
  }
}

