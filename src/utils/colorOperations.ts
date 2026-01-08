import type { RGB, HSL, Color, RecipeIngredient } from '../types'
import {
  rgbToHsl,
  hslToRgb,
  normalizeRgb,
  hexToRgb,
  rgbToHex,
} from './colorConversions'

/**
 * Смешивание цветов по пропорциям (взвешенное среднее RGB)
 * @param ingredients - Массив ингредиентов с цветами и пропорциями
 * @param getColorById - Функция для получения цвета по ID
 * @returns Результирующий RGB цвет
 */
export function mixColors(
  ingredients: RecipeIngredient[],
  getColorById: (id: string) => Color | undefined
): RGB {
  if (ingredients.length === 0) {
    throw new Error('Cannot mix colors: no ingredients provided')
  }

  let totalR = 0
  let totalG = 0
  let totalB = 0
  let totalWeight = 0

  for (const ingredient of ingredients) {
    const color = getColorById(ingredient.colorId)
    if (!color) {
      throw new Error(`Color not found: ${ingredient.colorId}`)
    }

    const weight = Math.max(0, ingredient.proportion) // Пропорция не может быть отрицательной
    totalR += color.rgb.r * weight
    totalG += color.rgb.g * weight
    totalB += color.rgb.b * weight
    totalWeight += weight
  }

  if (totalWeight === 0) {
    throw new Error('Cannot mix colors: total weight is zero')
  }

  return normalizeRgb({
    r: totalR / totalWeight,
    g: totalG / totalWeight,
    b: totalB / totalWeight,
  })
}

/**
 * Расчет яркости цвета (luminance) по формуле относительной яркости
 * @param rgb - RGB значения
 * @returns Яркость от 0 до 1
 */
export function calculateLuminance(rgb: RGB): number {
  const normalize = (value: number) => {
    const v = value / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }

  const r = normalize(rgb.r)
  const g = normalize(rgb.g)
  const b = normalize(rgb.b)

  return 0.299 * r + 0.587 * g + 0.114 * b
}

/**
 * Расчет насыщенности цвета (saturation) из HSL
 * @param color - Цвет
 * @returns Насыщенность от 0 до 100
 */
export function calculateSaturation(color: Color): number {
  return color.hsl.s
}

/**
 * Расчет яркости (lightness) из HSL
 * @param color - Цвет
 * @returns Яркость от 0 до 100
 */
export function calculateLightness(color: Color): number {
  return color.hsl.l
}

/**
 * Расчет евклидова расстояния между двумя RGB цветами
 * @param color1 - Первый цвет (RGB)
 * @param color2 - Второй цвет (RGB)
 * @returns Расстояние (чем меньше, тем ближе цвета)
 */
export function calculateColorDistance(color1: RGB, color2: RGB): number {
  const dr = color1.r - color2.r
  const dg = color1.g - color2.g
  const db = color1.b - color2.b

  return Math.sqrt(dr * dr + dg * dg + db * db)
}

/**
 * Расчет расстояния между двумя Color объектами
 * @param color1 - Первый цвет
 * @param color2 - Второй цвет
 * @returns Расстояние
 */
export function calculateColorDistanceFull(
  color1: Color,
  color2: Color
): number {
  return calculateColorDistance(color1.rgb, color2.rgb)
}

/**
 * Поиск ближайшего цвета из палитры к целевому цвету
 * @param targetColor - Целевой цвет
 * @param palette - Палитра цветов
 * @returns Ближайший цвет и расстояние до него
 */
export function findNearestColor(
  targetColor: Color,
  palette: Color[]
): { color: Color; distance: number } {
  if (palette.length === 0) {
    throw new Error('Cannot find nearest color: palette is empty')
  }

  let nearest = palette[0]
  let minDistance = calculateColorDistanceFull(targetColor, nearest)

  for (let i = 1; i < palette.length; i++) {
    const distance = calculateColorDistanceFull(targetColor, palette[i])
    if (distance < minDistance) {
      minDistance = distance
      nearest = palette[i]
    }
  }

  return { color: nearest, distance: minDistance }
}

/**
 * Проверка, является ли цвет "черным" (очень темный)
 * Улучшенная версия: проверяет и яркость, и насыщенность, чтобы отличить
 * черный пигмент от темно-красного или темно-синего
 * @param color - Цвет для проверки
 * @param lightnessThreshold - Порог яркости (по умолчанию 15)
 * @param saturationThreshold - Порог насыщенности (по умолчанию 5)
 * @returns true если цвет считается черным пигментом
 */
export function isBlackColor(
  color: Color,
  lightnessThreshold: number = 15,
  saturationThreshold: number = 5
): boolean {
  // Черным пигментом считаем цвет, у которого:
  // 1. Очень низкая яркость (L < 15) И
  // 2. Насыщенность близка к нулю (S < 5)
  // Это отличит "Черную краску" от "Темно-бордовой" или "Темно-синей"
  
  // Также проверяем название цвета - если содержит "black" (case-insensitive),
  // считаем его черным независимо от значений
  const nameLower = color.name?.toLowerCase() || ''
  if (nameLower.includes('black') || nameLower.includes('чёрный') || nameLower.includes('черный')) {
    return true
  }
  
  return color.hsl.l < lightnessThreshold && color.hsl.s < saturationThreshold
}

/**
 * Проверка, является ли цвет черным пигментом (алиас для isBlackColor с улучшенными параметрами)
 * Используется для фильтрации палитры при поиске рецептов
 * @param color - Цвет для проверки
 * @returns true если цвет считается черным пигментом
 */
export function isBlackInk(color: Color): boolean {
  return isBlackColor(color, 15, 5)
}

/**
 * Проверка, является ли цвет "белым" (очень светлый)
 * @param color - Цвет для проверки
 * @param threshold - Порог яркости (по умолчанию 70)
 * @returns true если цвет считается белым
 */
export function isWhiteColor(color: Color, threshold: number = 70): boolean {
  return color.hsl.l > threshold && color.hsl.s < 20
}

/**
 * Проверка, является ли цвет "серым" (низкая насыщенность)
 * @param color - Цвет для проверки
 * @param saturationThreshold - Порог насыщенности (по умолчанию 10)
 * @returns true если цвет считается серым
 */
export function isGrayColor(
  color: Color,
  saturationThreshold: number = 10
): boolean {
  return color.hsl.s < saturationThreshold
}

/**
 * Проверка, является ли цвет "цветным" (не черный, не белый, не серый)
 * @param color - Цвет для проверки
 * @returns true если цвет считается цветным
 */
export function isColorful(color: Color): boolean {
  return !isBlackColor(color) && !isWhiteColor(color) && !isGrayColor(color)
}

/**
 * Создание Color объекта из RGB
 * @param rgb - RGB значения
 * @param id - ID цвета (опционально, будет сгенерирован)
 * @param name - Название цвета (опционально)
 * @returns Color объект
 */
export function createColorFromRgb(
  rgb: RGB,
  id?: string,
  name?: string
): Color {
  const normalizedRgb = normalizeRgb(rgb)
  const hsl = rgbToHsl(normalizedRgb)
  const hex = rgbToHex(normalizedRgb)

  return {
    id: id || `color-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    rgb: normalizedRgb,
    hsl,
    hex,
  }
}

/**
 * Создание Color объекта из HSL
 * @param hsl - HSL значения
 * @param id - ID цвета (опционально)
 * @param name - Название цвета (опционально)
 * @returns Color объект
 */
export function createColorFromHsl(
  hsl: HSL,
  id?: string,
  name?: string
): Color {
  const rgb = hslToRgb(hsl)
  return createColorFromRgb(rgb, id, name)
}

/**
 * Создание Color объекта из HEX
 * @param hex - HEX строка
 * @param id - ID цвета (опционально)
 * @param name - Название цвета (опционально)
 * @returns Color объект
 */
export function createColorFromHex(
  hex: string,
  id?: string,
  name?: string
): Color {
  const rgb = hexToRgb(hex)
  return createColorFromRgb(rgb, id, name)
}

/**
 * Расчет комплементарного цвета (противоположного на цветовом круге)
 * Комплементарный цвет получается сдвигом HUE на 180 градусов
 * Используется для затемнения цветных оттенков без использования черного
 * @param color - Исходный цвет
 * @returns Комплементарный цвет (HSL)
 */
export function getComplementaryColor(color: Color): HSL {
  // Сдвигаем HUE на 180 градусов
  let complementaryHue = (color.hsl.h + 180) % 360
  
  // Сохраняем насыщенность и яркость (или можно скорректировать для лучшего затемнения)
  // Для затемнения обычно нужна средняя/высокая насыщенность
  const complementarySaturation = Math.max(30, color.hsl.s) // Минимум 30% для видимости
  const complementaryLightness = Math.min(70, Math.max(30, color.hsl.l)) // Ограничиваем диапазон 30-70%
  
  return {
    h: Math.round(complementaryHue),
    s: Math.round(complementarySaturation),
    l: Math.round(complementaryLightness),
  }
}

/**
 * Получение названия цвета на основе HUE значения
 * Используется для рекомендаций пользователю
 * @param hue - HUE значение (0-360)
 * @returns Название цвета на русском языке
 */
export function getColorNameFromHue(hue: number): string {
  // Нормализуем HUE к диапазону 0-360
  const normalizedHue = ((hue % 360) + 360) % 360
  
  if (normalizedHue < 15 || normalizedHue >= 345) {
    return 'красный'
  } else if (normalizedHue >= 15 && normalizedHue < 45) {
    return 'оранжево-красный'
  } else if (normalizedHue >= 45 && normalizedHue < 75) {
    return 'оранжевый'
  } else if (normalizedHue >= 75 && normalizedHue < 105) {
    return 'желтый'
  } else if (normalizedHue >= 105 && normalizedHue < 135) {
    return 'желто-зеленый'
  } else if (normalizedHue >= 135 && normalizedHue < 165) {
    return 'зеленый'
  } else if (normalizedHue >= 165 && normalizedHue < 195) {
    return 'голубо-зеленый'
  } else if (normalizedHue >= 195 && normalizedHue < 225) {
    return 'голубой'
  } else if (normalizedHue >= 225 && normalizedHue < 255) {
    return 'синий'
  } else if (normalizedHue >= 255 && normalizedHue < 285) {
    return 'сине-фиолетовый'
  } else if (normalizedHue >= 285 && normalizedHue < 315) {
    return 'фиолетовый'
  } else {
    return 'красно-фиолетовый'
  }
}

