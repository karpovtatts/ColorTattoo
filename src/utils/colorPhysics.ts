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

/**
 * Последовательное субтрактивное смешивание цветов с учетом порядка
 * 
 * При последовательном смешивании результат может отличаться, так как каждый
 * следующий цвет смешивается с уже полученной смесью, а не со всеми исходными цветами.
 * 
 * Порядок важен, особенно при работе с тату-красками, где смешивание происходит постепенно.
 * 
 * @param ingredients - Массив ингредиентов с цветами и пропорциями (в порядке добавления)
 * @param getColorById - Функция для получения цвета по ID
 * @returns Результирующий RGB цвет
 */
export function mixColorsSubtractiveSequential(
  ingredients: RecipeIngredient[],
  getColorById: (id: string) => Color | undefined
): RGB {
  if (ingredients.length === 0) {
    throw new Error('Cannot mix colors: no ingredients provided')
  }

  if (ingredients.length === 1) {
    const color = getColorById(ingredients[0].colorId)
    if (!color) {
      throw new Error(`Color not found: ${ingredients[0].colorId}`)
    }
    return normalizeRgb(color.rgb)
  }

  // Начинаем с первого цвета
  let currentRgb = normalizeRgb(getColorById(ingredients[0].colorId)!.rgb)
  let currentTotalWeight = ingredients[0].proportion

  // Последовательно смешиваем с остальными цветами
  for (let i = 1; i < ingredients.length; i++) {
    const color = getColorById(ingredients[i].colorId)
    if (!color) {
      throw new Error(`Color not found: ${ingredients[i].colorId}`)
    }

    const newWeight = ingredients[i].proportion
    const totalWeight = currentTotalWeight + newWeight

    // Конвертируем текущий результат и новый цвет в CMYK
    const currentCmyk = rgbToCmyk(currentRgb)
    const newCmyk = rgbToCmyk(color.rgb)

    // Смешиваем с учетом весов (взвешенное среднее)
    // Новый цвет добавляется к уже существующей смеси
    const mixedCmyk = {
      c: (currentCmyk.c * currentTotalWeight + newCmyk.c * newWeight) / totalWeight,
      m: (currentCmyk.m * currentTotalWeight + newCmyk.m * newWeight) / totalWeight,
      y: (currentCmyk.y * currentTotalWeight + newCmyk.y * newWeight) / totalWeight,
      k: (currentCmyk.k * currentTotalWeight + newCmyk.k * newWeight) / totalWeight,
    }

    // Ограничиваем значения
    const clampedCmyk = {
      c: Math.max(0, Math.min(100, mixedCmyk.c)),
      m: Math.max(0, Math.min(100, mixedCmyk.m)),
      y: Math.max(0, Math.min(100, mixedCmyk.y)),
      k: Math.max(0, Math.min(100, mixedCmyk.k)),
    }

    // Обновляем текущий результат
    currentRgb = normalizeRgb(cmykToRgb(clampedCmyk))
    currentTotalWeight = totalWeight
  }

  return currentRgb
}

