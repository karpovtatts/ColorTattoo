import type { Color, Recipe, RecipeIngredient, Warning, ColorAnalysis } from '@/types'
import {
  calculateSaturation,
  calculateLightness,
  isBlackColor,
  isColorful,
  isGrayColor,
} from '@/utils/colorOperations'

// Пороги для определения грязного цвета
const LOW_SATURATION_THRESHOLD = 25 // Низкая насыщенность (S < 25)
const MEDIUM_LIGHTNESS_MIN = 20 // Минимальная яркость для среднего диапазона
const MEDIUM_LIGHTNESS_MAX = 80 // Максимальная яркость для среднего диапазона
const GRAYISH_THRESHOLD = 15 // Порог для определения сероватости

/**
 * Правило R01: Определение грязного цвета
 * Цвет считается грязным, если:
 * - Низкая насыщенность (S < 25) И средняя/низкая яркость
 * - Уход в серо-коричневый диапазон
 * - Потеря хроматики
 */
export function analyzeColorCleanliness(color: Color): {
  isClean: boolean
  isDirty: boolean
  reason?: string
} {
  const saturation = calculateSaturation(color)
  const lightness = calculateLightness(color)

  // Проверка на низкую насыщенность с средней/низкой яркостью
  if (
    saturation < LOW_SATURATION_THRESHOLD &&
    lightness >= MEDIUM_LIGHTNESS_MIN &&
    lightness <= MEDIUM_LIGHTNESS_MAX
  ) {
    return {
      isClean: false,
      isDirty: true,
      reason: `Низкая насыщенность (${Math.round(saturation)}%) и средняя яркость могут привести к потере хроматики в коже.`,
    }
  }

  // Проверка на сероватость (признак грязного цвета)
  if (isGrayColor(color, GRAYISH_THRESHOLD)) {
    return {
      isClean: false,
      isDirty: true,
      reason: 'Цвет имеет сероватый оттенок, что может выглядеть грязно в коже.',
    }
  }

  // Проверка на очень низкую насыщенность при любой яркости (кроме очень светлых/темных)
  if (saturation < 15 && lightness > 10 && lightness < 90) {
    return {
      isClean: false,
      isDirty: true,
      reason: `Очень низкая насыщенность (${Math.round(saturation)}%) может привести к потере цвета в коже.`,
    }
  }

  // Чистый цвет
  return {
    isClean: true,
    isDirty: false,
  }
}

/**
 * Правило R02: Обнаружение использования черного для затемнения цветных оттенков
 * Черный допустим:
 * - В ЧБ работах
 * - В техниках типа silvera
 * В цветных работах: черный не затемняет, а загрязняет
 */
export function analyzeBlackUsage(
  recipe: Recipe,
  getColorById: (id: string) => Color | undefined
): {
  hasBlackIssue: boolean
  warning?: Warning
  alternative?: string
} {
  // Проверяем, является ли целевой цвет цветным (не ЧБ)
  const isTargetColorful = isColorful(recipe.targetColor)

  // Если целевой цвет не цветной (ЧБ), черный допустим
  if (!isTargetColorful) {
    return {
      hasBlackIssue: false,
    }
  }

  // Ищем черный цвет в ингредиентах
  let blackIngredient: RecipeIngredient | null = null
  let blackColor: Color | null = null

  for (const ingredient of recipe.ingredients) {
    const color = getColorById(ingredient.colorId)
    if (color && isBlackColor(color)) {
      blackIngredient = ingredient
      blackColor = color
      break
    }
  }

  // Если черный найден в рецепте для цветного целевого цвета
  if (blackIngredient && blackColor) {
    const proportion = blackIngredient.proportion
    const severity: 'low' | 'medium' | 'high' =
      proportion > 0.3 ? 'high' : proportion > 0.15 ? 'medium' : 'low'

    return {
      hasBlackIssue: true,
      warning: {
        type: 'black_usage',
        message: `Использование черного (${Math.round(proportion * 100)}%) для затемнения цветных оттенков загрязняет цвет. В коже это может выглядеть грязно.`,
        severity,
      },
      alternative:
        'Рекомендуется затемнять через комплементарные цвета или использовать более темные оттенки базовых цветов вместо черного.',
    }
  }

  return {
    hasBlackIssue: false,
  }
}

/**
 * Анализ проблемных комбинаций цветов
 * Проверка на смешивание комплементарных цветов в равных пропорциях (риск серого)
 */
export function analyzeProblematicCombinations(
  recipe: Recipe,
  getColorById: (id: string) => Color | undefined
): Warning[] {
  const warnings: Warning[] = []

  // Проверка на смешивание комплементарных цветов
  if (recipe.ingredients.length >= 2) {
    const colors = recipe.ingredients
      .map((ing) => getColorById(ing.colorId))
      .filter((c): c is Color => c !== undefined)

    // Проверяем пары цветов на комплементарность
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const color1 = colors[i]
        const color2 = colors[j]
        const hueDiff = Math.abs(color1.hsl.h - color2.hsl.h)

        // Комплементарные цвета находятся примерно на 180 градусов друг от друга
        // Учитываем переход через 0/360
        const complementaryDiff =
          hueDiff > 180 ? 360 - hueDiff : hueDiff

        if (complementaryDiff > 150 && complementaryDiff < 210) {
          const prop1 = recipe.ingredients[i].proportion
          const prop2 = recipe.ingredients[j].proportion
          const ratio = Math.min(prop1, prop2) / Math.max(prop1, prop2)

          // Если пропорции близки (разница менее 30%), это риск серого
          if (ratio > 0.7) {
            warnings.push({
              type: 'dirty',
              message: `Смешивание комплементарных цветов в близких пропорциях может дать грязный серый оттенок.`,
              severity: 'medium',
            })
          }
        }
      }
    }
  }

  return warnings
}

/**
 * Полный анализ цвета и рецепта
 * Объединяет все проверки и генерирует предупреждения
 */
export function analyzeColorAndRecipe(
  recipe: Recipe,
  getColorById: (id: string) => Color | undefined
): {
  analysis: ColorAnalysis
  warnings: Warning[]
} {
  const warnings: Warning[] = []

  // Анализ чистоты результирующего цвета (R01)
  const cleanliness = analyzeColorCleanliness(recipe.resultColor)
  if (cleanliness.isDirty) {
    warnings.push({
      type: 'dirty',
      message: cleanliness.reason || 'Результирующий цвет может быть грязным в коже.',
      severity: 'high',
    })
  }

  // Анализ использования черного (R02)
  const blackAnalysis = analyzeBlackUsage(recipe, getColorById)
  if (blackAnalysis.hasBlackIssue && blackAnalysis.warning) {
    warnings.push(blackAnalysis.warning)
  }

  // Анализ проблемных комбинаций
  const combinationWarnings = analyzeProblematicCombinations(recipe, getColorById)
  warnings.push(...combinationWarnings)

  // Формируем объяснения
  const explanations: string[] = []

  if (cleanliness.isDirty) {
    explanations.push(
      `Цвет имеет низкую насыщенность или сероватый оттенок, что может привести к потере хроматики в коже.`
    )
  }

  if (blackAnalysis.hasBlackIssue) {
    explanations.push(
      `Использование черного для затемнения цветных оттенков не рекомендуется, так как черный загрязняет цвет вместо затемнения.`
    )
    if (blackAnalysis.alternative) {
      explanations.push(blackAnalysis.alternative)
    }
  }

  if (combinationWarnings.length > 0) {
    explanations.push(
      `Смешивание комплементарных цветов в равных пропорциях может дать серый оттенок.`
    )
  }

  // Если нет проблем, добавляем положительное объяснение
  if (warnings.length === 0) {
    explanations.push('Цвет выглядит чистым и должен хорошо работать в коже.')
  }

  // Формируем анализ
  const analysis: ColorAnalysis = {
    isClean: !cleanliness.isDirty && !blackAnalysis.hasBlackIssue,
    isDirty: cleanliness.isDirty || blackAnalysis.hasBlackIssue,
    isWarm: false, // Будет реализовано в этапе 7
    isCool: false, // Будет реализовано в этапе 7
    warnings: warnings.map((w) => w.message),
    explanations,
  }

  return {
    analysis,
    warnings,
  }
}

