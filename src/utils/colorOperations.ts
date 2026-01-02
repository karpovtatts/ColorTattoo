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
 * @param color - Цвет для проверки
 * @param threshold - Порог яркости (по умолчанию 30)
 * @returns true если цвет считается черным
 */
export function isBlackColor(color: Color, threshold: number = 30): boolean {
  return color.hsl.l < threshold
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

