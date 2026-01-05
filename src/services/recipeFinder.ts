import type {
  Color,
  UserPalette,
  Recipe,
  RecipeIngredient,
  RecipeResult,
} from '@/types'
import {
  createColorFromRgb,
  isBlackColor,
  isColorful,
} from '@/utils/colorOperations'
import { mixColorsSubtractive } from '@/utils/colorPhysics'
import { calculateColorDistancePerceptualFull } from '@/utils/colorMetric'
import { analyzeColorAndRecipe } from './colorAnalysis'

// Константы для алгоритма
const MAX_INGREDIENTS = 4 // Максимальное количество ингредиентов в рецепте
// Пороги для DeltaE (перцептивное расстояние):
// - < 2: Неразличимо для человеческого глаза
// - 2-5: Очень близкие цвета
// - 5-10: Похожие цвета
// - > 10: Разные цвета
const EXACT_MATCH_THRESHOLD = 2 // Порог для точного совпадения (DeltaE)
const UNREACHABLE_THRESHOLD = 15 // Порог для недостижимого цвета (DeltaE)

// Штраф за использование черного для затемнения цветных оттенков
// Это заставит алгоритм предпочитать альтернативные решения (например, темно-коричневый)
const BLACK_PENALTY = 25 // Штраф в DeltaE единицах

// Шаг перебора пропорций (чем меньше, тем точнее, но медленнее)
const PROPORTION_STEP_2 = 0.05 // Шаг для 2 цветов (5%)
const PROPORTION_STEP_3 = 0.05 // Шаг для 3 цветов (5%)
const PROPORTION_STEP_4 = 0.1 // Шаг для 4 цветов (10% - для производительности)

/**
 * Генерация всех комбинаций цветов из палитры
 * @param palette - Палитра цветов
 * @param count - Количество цветов в комбинации
 * @returns Массив комбинаций (каждая комбинация - массив индексов цветов)
 */
function generateCombinations(
  palette: Color[],
  count: number
): number[][] {
  const combinations: number[][] = []

  function backtrack(start: number, current: number[]) {
    if (current.length === count) {
      combinations.push([...current])
      return
    }

    for (let i = start; i < palette.length; i++) {
      current.push(i)
      backtrack(i, current) // Разрешаем повторения цветов
      current.pop()
    }
  }

  backtrack(0, [])
  return combinations
}


/**
 * Поиск оптимальных пропорций для комбинации цветов методом перебора
 * @param targetColor - Целевой цвет
 * @param colors - Массив цветов для смешивания
 * @returns Оптимальные пропорции и результирующий цвет
 */
function optimizeProportions(
  targetColor: Color,
  colors: Color[]
): { proportions: number[]; resultColor: Color; distance: number } {
  let bestDistance = Infinity
  let bestProportions: number[] = colors.map(() => 1 / colors.length)
  let bestResultColor: Color | null = null

  const getColorById = (id: string) => colors.find((c) => c.id === id)

  // Для 1 цвета - просто возвращаем его
  if (colors.length === 1) {
    const distance = calculateColorDistancePerceptualFull(targetColor, colors[0])
    return {
      proportions: [1],
      resultColor: colors[0],
      distance,
    }
  }

  // Для 2 цветов - перебираем пропорции с более точным шагом
  if (colors.length === 2) {
    for (let p1 = 0.05; p1 <= 0.95; p1 += PROPORTION_STEP_2) {
      const p2 = 1 - p1
      const proportions = [p1, p2]

      const ingredients: RecipeIngredient[] = colors.map((color, idx) => ({
        colorId: color.id,
        proportion: proportions[idx],
      }))

      const resultRgb = mixColorsSubtractive(ingredients, getColorById)
      const resultColor = createColorFromRgb(resultRgb)
      const distance = calculateColorDistancePerceptualFull(targetColor, resultColor)

      if (distance < bestDistance) {
        bestDistance = distance
        bestProportions = proportions
        bestResultColor = resultColor
      }

      // Если достигли точного совпадения, выходим
      if (distance < EXACT_MATCH_THRESHOLD) {
        break
      }
    }
  }

  // Для 3 цветов - перебираем пропорции с более точным шагом
  if (colors.length === 3) {
    for (let p1 = 0.05; p1 <= 0.9; p1 += PROPORTION_STEP_3) {
      for (let p2 = 0.05; p2 <= 0.9 - p1; p2 += PROPORTION_STEP_3) {
        const p3 = 1 - p1 - p2
        if (p3 < 0.05) continue

        const proportions = [p1, p2, p3]

        const ingredients: RecipeIngredient[] = colors.map((color, idx) => ({
          colorId: color.id,
          proportion: proportions[idx],
        }))

        const resultRgb = mixColorsSubtractive(ingredients, getColorById)
        const resultColor = createColorFromRgb(resultRgb)
        const distance = calculateColorDistancePerceptualFull(targetColor, resultColor)

        if (distance < bestDistance) {
          bestDistance = distance
          bestProportions = proportions
          bestResultColor = resultColor
        }

        // Если достигли точного совпадения, выходим
        if (distance < EXACT_MATCH_THRESHOLD) {
          break
        }
      }
      if (bestDistance < EXACT_MATCH_THRESHOLD) break
    }
  }

  // Для 4 цветов - перебираем пропорции
  if (colors.length === 4) {
    for (let p1 = 0.1; p1 <= 0.7; p1 += PROPORTION_STEP_4) {
      for (let p2 = 0.1; p2 <= 0.7 - p1; p2 += PROPORTION_STEP_4) {
        for (let p3 = 0.1; p3 <= 0.7 - p1 - p2; p3 += PROPORTION_STEP_4) {
          const p4 = 1 - p1 - p2 - p3
          if (p4 < 0.1) continue

          const proportions = [p1, p2, p3, p4]

          const ingredients: RecipeIngredient[] = colors.map((color, idx) => ({
            colorId: color.id,
            proportion: proportions[idx],
          }))

          const resultRgb = mixColorsSubtractive(ingredients, getColorById)
          const resultColor = createColorFromRgb(resultRgb)
          const distance = calculateColorDistancePerceptualFull(targetColor, resultColor)

          if (distance < bestDistance) {
            bestDistance = distance
            bestProportions = proportions
            bestResultColor = resultColor
          }

          // Если достигли точного совпадения, выходим
          if (distance < EXACT_MATCH_THRESHOLD) {
            break
          }
        }
        if (bestDistance < EXACT_MATCH_THRESHOLD) break
      }
      if (bestDistance < EXACT_MATCH_THRESHOLD) break
    }
  }

  if (!bestResultColor) {
    // Fallback - равномерное распределение
    const ingredients: RecipeIngredient[] = colors.map((color) => ({
      colorId: color.id,
      proportion: 1 / colors.length,
    }))

    const resultRgb = mixColorsSubtractive(ingredients, getColorById)
    bestResultColor = createColorFromRgb(resultRgb)
    bestDistance = calculateColorDistancePerceptualFull(targetColor, bestResultColor)
    bestProportions = colors.map(() => 1 / colors.length)
  }

  return {
    proportions: bestProportions,
    resultColor: bestResultColor,
    distance: bestDistance,
  }
}

/**
 * Поиск рецепта для целевого цвета
 * @param targetColor - Целевой цвет
 * @param palette - Палитра пользователя
 * @param maxIngredients - Максимальное количество ингредиентов (по умолчанию 3)
 * @returns Результат подбора рецепта или информация о недостижимом цвете
 */
export function findRecipe(
  targetColor: Color,
  palette: UserPalette,
  maxIngredients: number = MAX_INGREDIENTS
): RecipeResult {
  if (palette.colors.length === 0) {
    throw new Error('Палитра пуста. Добавьте цвета в палитру.')
  }

  if (palette.colors.length < 2) {
    throw new Error('В палитре должно быть минимум 2 цвета.')
  }

  // Функция для получения цвета по ID из палитры
  const getColorById = (id: string): Color | undefined => {
    return palette.colors.find((c) => c.id === id)
  }

  // Проверяем, есть ли точное совпадение в палитре
  // Используем перцептивную метрику для проверки точного совпадения
  let nearestInPalette = palette.colors[0]
  let minDistance = calculateColorDistancePerceptualFull(targetColor, nearestInPalette)
  
  for (let i = 1; i < palette.colors.length; i++) {
    const distance = calculateColorDistancePerceptualFull(targetColor, palette.colors[i])
    if (distance < minDistance) {
      minDistance = distance
      nearestInPalette = palette.colors[i]
    }
  }
  
  if (minDistance < EXACT_MATCH_THRESHOLD) {
    // Точное совпадение - используем один цвет
    const recipe: Recipe = {
      id: `recipe-${Date.now()}`,
      targetColor,
      resultColor: nearestInPalette,
      ingredients: [
        {
          colorId: nearestInPalette.id,
          proportion: 1,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Анализируем рецепт (даже для одного цвета)
    const { analysis, warnings } = analyzeColorAndRecipe(recipe, getColorById)

    return {
      recipe,
      analysis,
      warnings,
      isExactMatch: true,
      distance: minDistance,
    }
  }

  // Перебираем комбинации от 1 до maxIngredients цветов
  let bestResult: {
    ingredients: RecipeIngredient[]
    resultColor: Color
    distance: number
  } | null = null

  // Проверяем, является ли целевой цвет цветным (не ЧБ)
  const isTargetColorful = isColorful(targetColor)

  for (let ingredientCount = 1; ingredientCount <= maxIngredients; ingredientCount++) {
    const combinations = generateCombinations(palette.colors, ingredientCount)

    for (const combination of combinations) {
      const colors = combination.map((idx) => palette.colors[idx])

      // Оптимизируем пропорции для этой комбинации
      const optimized = optimizeProportions(targetColor, colors)

      // Вычисляем финальное расстояние с учетом штрафов
      let finalDistance = optimized.distance

      // Если целевой цвет цветной, добавляем штраф за использование черного
      if (isTargetColorful) {
        const hasBlack = colors.some((color) => isBlackColor(color))
        if (hasBlack) {
          // Находим пропорцию черного в оптимизированном рецепте
          let blackProportion = 0
          for (let i = 0; i < colors.length; i++) {
            if (isBlackColor(colors[i])) {
              blackProportion = optimized.proportions[i]
              break
            }
          }
          // Штраф пропорционален количеству черного
          // Если черного много (>20%), штраф максимальный
          // Если черного мало (<10%), штраф минимальный
          const penaltyMultiplier = Math.min(1, blackProportion / 0.2)
          finalDistance += BLACK_PENALTY * penaltyMultiplier
        }
      }

      // Сравниваем с учетом штрафов
      const currentBestDistance = bestResult ? bestResult.distance : Infinity
      if (finalDistance < currentBestDistance) {
        bestResult = {
          ingredients: colors.map((color, idx) => ({
            colorId: color.id,
            proportion: optimized.proportions[idx],
          })),
          resultColor: optimized.resultColor,
          distance: optimized.distance, // Сохраняем реальное расстояние без штрафа
        }
      }

      // Если нашли точное совпадение (без штрафов), прекращаем поиск
      if (optimized.distance < EXACT_MATCH_THRESHOLD) {
        break
      }
    }

    // Если нашли точное совпадение, прекращаем поиск
    if (bestResult && bestResult.distance < EXACT_MATCH_THRESHOLD) {
      break
    }
  }

  if (!bestResult) {
    throw new Error('Не удалось найти рецепт. Проверьте палитру.')
  }

  // Всегда создаем рецепт, даже если цвет недостижим
  // Пользователь должен видеть, какие цвета нужно смешивать
  const recipe: Recipe = {
    id: `recipe-${Date.now()}`,
    targetColor,
    resultColor: bestResult.resultColor,
    ingredients: bestResult.ingredients,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // Анализируем рецепт (правила R01, R02)
  const { analysis, warnings } = analyzeColorAndRecipe(recipe, getColorById)

  const isExactMatch = bestResult.distance < EXACT_MATCH_THRESHOLD
  const isUnreachable = bestResult.distance > UNREACHABLE_THRESHOLD

  // Если цвет недостижим, добавляем предупреждение
  if (isUnreachable) {
    const explanation = generateUnreachableExplanation(
      targetColor,
      bestResult.resultColor,
      bestResult.ingredients,
      getColorById
    )
    
    warnings.push({
      type: 'unreachable',
      message: explanation,
      severity: 'high',
    })
  }

  return {
    recipe,
    analysis,
    warnings,
    isExactMatch,
    distance: bestResult.distance,
  }
}

/**
 * Генерация объяснения, почему цвет недостижим, и списка цветов для смешивания
 * @param targetColor - Целевой цвет
 * @param nearestColor - Ближайший достижимый цвет
 * @param ingredients - Ингредиенты рецепта
 * @param getColorById - Функция для получения цвета по ID
 * @returns Текстовое объяснение с рецептом
 */
function generateUnreachableExplanation(
  targetColor: Color,
  nearestColor: Color,
  ingredients: RecipeIngredient[],
  getColorById: (id: string) => Color | undefined
): string {
  const reasons: string[] = []

  // Проверка насыщенности
  if (targetColor.hsl.s > nearestColor.hsl.s + 20) {
    reasons.push('слишком высокая насыщенность')
  }

  // Проверка яркости
  if (targetColor.hsl.l > nearestColor.hsl.l + 20) {
    reasons.push('слишком высокая яркость')
  } else if (targetColor.hsl.l < nearestColor.hsl.l - 20) {
    reasons.push('слишком низкая яркость')
  }

  // Проверка оттенка
  const hueDiff = Math.abs(targetColor.hsl.h - nearestColor.hsl.h)
  if (hueDiff > 30 && hueDiff < 330) {
    reasons.push('требуется оттенок, которого нет в палитре')
  }

  // Формируем список цветов для смешивания
  const colorList = ingredients
    .map((ing) => {
      const color = getColorById(ing.colorId)
      if (!color) return null
      const percentage = Math.round(ing.proportion * 100)
      return `${color.hex} (${percentage}%)`
    })
    .filter((item): item is string => item !== null)
    .join(', ')

  const reasonText = reasons.length > 0 
    ? `Цветов для достижения в палитре нет (${reasons.join(', ')}). `
    : 'Цветов для достижения в палитре нет. '

  return `${reasonText}Чтобы получить максимально близкий цвет, нужно смешивать такие оттенки: ${colorList}`
}

