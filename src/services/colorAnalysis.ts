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

// Пороги для определения температуры цвета
const NEUTRAL_SATURATION_THRESHOLD = 20 // Низкая насыщенность = нейтральный

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
    // Всегда высокий приоритет - смешивание с черным всегда дает грязь
    const severity: 'low' | 'medium' | 'high' = 'high'

    return {
      hasBlackIssue: true,
      warning: {
        type: 'black_usage',
        message: `⚠️ Смешивание с черным (${Math.round(proportion * 100)}%) дает грязь. Заживший оттенок в коже будет грязным. Черный не затемняет цветные оттенки, а загрязняет их.`,
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
 * Анализ температуры цвета (теплый/холодный/нейтральный)
 * Этап 7: Анализ тёплый/холодный (F04)
 * 
 * Алгоритм:
 * - Теплые цвета: оттенки красного, оранжевого, желтого (H примерно 0-90, 330-360)
 * - Холодные цвета: оттенки синего, зеленого, фиолетового (H примерно 90-270)
 * - Нейтральные: серые, бежевые (низкая насыщенность)
 */
export function analyzeColorTemperature(color: Color): {
  isWarm: boolean
  isCool: boolean
  isNeutral: boolean
  temperature: number // -1 (холодный) до +1 (теплый)
  explanation: string
} {
  const hue = color.hsl.h
  const saturation = color.hsl.s

  // Если насыщенность очень низкая, цвет нейтральный (не теплый и не холодный)
  if (saturation < NEUTRAL_SATURATION_THRESHOLD) {
    return {
      isWarm: false,
      isCool: false,
      isNeutral: true,
      temperature: 0,
      explanation: 'Цвет нейтральный, близок к серому. Низкая насыщенность делает цвет бесцветным.',
    }
  }

  // Определяем температуру на основе оттенка (Hue)
  // Теплые цвета: красный (0-90, 270-360), оранжевый, желтый
  // Холодные цвета: зеленый (90-270), синий, фиолетовый
  
  let isWarm = false
  let isCool = false
  let temperature = 0

  // Проверяем теплый диапазон: 270-360 и 0-90
  // Объединяем диапазоны: 270-360 (красный) и 0-90 (красный-желтый)
  const WARM_HUE_END = 90 // Конец теплого диапазона
  if (hue >= 270 || hue <= WARM_HUE_END) {
    isWarm = true
    // Нормализуем температуру:
    // - Красный (0 или 360) = максимально теплый (+1)
    // - Желтый (60-90) = менее теплый (около 0.5)
    // - Переход от 270 к 360 = от менее теплого к более теплому
    if (hue >= 270) {
      // 270-360: нормализуем к 0.5-1.0 (от фиолетово-красного к красному)
      temperature = 0.5 + ((hue - 270) / 90) * 0.5
    } else {
      // 0-90: нормализуем к 0.3-1.0 (от красного к желтому)
      temperature = 1.0 - (hue / WARM_HUE_END) * 0.7
    }
    // Ограничиваем диапазон 0.3-1.0 для теплых
    temperature = Math.max(0.3, Math.min(1.0, temperature))
  }
  // Холодный диапазон: 90-270
  else {
    isCool = true
    // Нормализуем температуру:
    // - Синий (180) = максимально холодный (-1)
    // - Зеленый (90-150) и фиолетовый (210-270) = менее холодный (около -0.5)
    const distanceFromCenter = Math.abs(hue - 180)
    temperature = -(1.0 - (distanceFromCenter / 90) * 0.5)
    // Ограничиваем диапазон -1.0 до -0.5 для холодных
    temperature = Math.max(-1.0, Math.min(-0.5, temperature))
  }

  // Формируем объяснение
  let explanation = ''
  if (isWarm) {
    if (hue >= 330 || hue <= 30) {
      explanation = 'Цвет теплый, с преобладанием красных оттенков.'
    } else if (hue > 30 && hue <= 60) {
      explanation = 'Цвет теплый, с преобладанием оранжевых оттенков.'
    } else if (hue > 60 && hue <= 90) {
      explanation = 'Цвет теплый, с преобладанием желтых оттенков.'
    } else {
      explanation = 'Цвет теплый, с преобладанием красно-фиолетовых оттенков.'
    }
  } else if (isCool) {
    if (hue >= 90 && hue < 150) {
      explanation = 'Цвет холодный, с преобладанием зеленых оттенков.'
    } else if (hue >= 150 && hue < 210) {
      explanation = 'Цвет холодный, с преобладанием синих оттенков.'
    } else {
      explanation = 'Цвет холодный, с преобладанием фиолетовых оттенков.'
    }
  }

  return {
    isWarm,
    isCool,
    isNeutral: !isWarm && !isCool,
    temperature,
    explanation,
  }
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

  // Анализ температуры цвета (Этап 7)
  const temperatureAnalysis = analyzeColorTemperature(recipe.resultColor)

  // Формируем объяснения
  const explanations: string[] = []

  if (cleanliness.isDirty) {
    explanations.push(
      `Цвет имеет низкую насыщенность или сероватый оттенок, что может привести к потере хроматики в коже.`
    )
  }

  if (blackAnalysis.hasBlackIssue) {
    explanations.push(
      `⚠️ ВНИМАНИЕ: Смешивание с любым черным дает грязь. Заживший оттенок в коже будет грязным. Черный не затемняет цветные оттенки, а загрязняет их.`
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

  // Добавляем объяснение температуры цвета
  if (temperatureAnalysis.explanation) {
    explanations.push(temperatureAnalysis.explanation)
  }

  // Если нет проблем, добавляем положительное объяснение
  if (warnings.length === 0) {
    explanations.push('Цвет выглядит чистым и должен хорошо работать в коже.')
  }

  // Формируем анализ
  const analysis: ColorAnalysis = {
    isClean: !cleanliness.isDirty && !blackAnalysis.hasBlackIssue,
    isDirty: cleanliness.isDirty || blackAnalysis.hasBlackIssue,
    isWarm: temperatureAnalysis.isWarm,
    isCool: temperatureAnalysis.isCool,
    warnings: warnings.map((w) => w.message),
    explanations,
  }

  return {
    analysis,
    warnings,
  }
}

