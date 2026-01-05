import type { RGB, RecipeIngredient, Color } from '../types'
import { rgbToCmyk, cmykToRgb, normalizeRgb } from './colorConversions'

/**
 * Субтрактивное смешивание цветов (эмуляция физических пигментов/красок)
 * 
 * В отличие от аддитивного смешивания RGB (свет), субтрактивное смешивание
 * работает как смешивание красок: каждый пигмент поглощает часть света.
 * 
 * Примеры:
 * - Желтый (#FFFF00) + Синий (#0000FF) = Зеленый (а не серый, как в RGB)
 * - Красный + Зеленый = Коричневый/Бурый
 * 
 * @param ingredients - Массив ингредиентов с цветами и пропорциями
 * @param getColorById - Функция для получения цвета по ID
 * @returns Результирующий RGB цвет
 */
export function mixColorsSubtractive(
  ingredients: RecipeIngredient[],
  getColorById: (id: string) => Color | undefined
): RGB {
  if (ingredients.length === 0) {
    throw new Error('Cannot mix colors: no ingredients provided')
  }

  // Конвертируем все цвета в CMYK
  const cmykColors: Array<{ cmyk: ReturnType<typeof rgbToCmyk>; weight: number }> = []

  let totalWeight = 0

  for (const ingredient of ingredients) {
    const color = getColorById(ingredient.colorId)
    if (!color) {
      throw new Error(`Color not found: ${ingredient.colorId}`)
    }

    const weight = Math.max(0, ingredient.proportion)
    if (weight === 0) continue

    const cmyk = rgbToCmyk(color.rgb)
    cmykColors.push({ cmyk, weight })
    totalWeight += weight
  }

  if (totalWeight === 0 || cmykColors.length === 0) {
    throw new Error('Cannot mix colors: total weight is zero')
  }

  // Если только один цвет, возвращаем его
  if (cmykColors.length === 1) {
    return normalizeRgb(getColorById(ingredients[0].colorId)!.rgb)
  }

  // Смешиваем в CMYK пространстве (взвешенное среднее)
  // В субтрактивной модели смешивание происходит через усреднение каналов CMYK
  let totalC = 0
  let totalM = 0
  let totalY = 0
  let totalK = 0

  for (const { cmyk, weight } of cmykColors) {
    const normalizedWeight = weight / totalWeight
    totalC += cmyk.c * normalizedWeight
    totalM += cmyk.m * normalizedWeight
    totalY += cmyk.y * normalizedWeight
    totalK += cmyk.k * normalizedWeight
  }

  // Конвертируем обратно в RGB
  const mixedCmyk = {
    c: Math.max(0, Math.min(100, totalC)),
    m: Math.max(0, Math.min(100, totalM)),
    y: Math.max(0, Math.min(100, totalY)),
    k: Math.max(0, Math.min(100, totalK)),
  }

  return normalizeRgb(cmykToRgb(mixedCmyk))
}

