import type {
  Color,
  UserPalette,
  Recipe,
  RecipeIngredient,
  RecipeResult,
  UnreachableColorResult,
} from '@/types'
import {
  mixColors,
  calculateColorDistanceFull,
  createColorFromRgb,
  findNearestColor,
} from '@/utils/colorOperations'
import { analyzeColorAndRecipe } from './colorAnalysis'

// Константы для алгоритма
const MAX_INGREDIENTS = 3 // Максимальное количество ингредиентов в рецепте
const EXACT_MATCH_THRESHOLD = 5 // Порог для точного совпадения (расстояние в RGB)
const UNREACHABLE_THRESHOLD = 50 // Порог для недостижимого цвета

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
    const distance = calculateColorDistanceFull(targetColor, colors[0])
    return {
      proportions: [1],
      resultColor: colors[0],
      distance,
    }
  }

  // Для 2 цветов - перебираем пропорции от 0.1 до 0.9 с шагом 0.1
  if (colors.length === 2) {
    for (let p1 = 0.1; p1 <= 0.9; p1 += 0.1) {
      const p2 = 1 - p1
      const proportions = [p1, p2]

      const ingredients: RecipeIngredient[] = colors.map((color, idx) => ({
        colorId: color.id,
        proportion: proportions[idx],
      }))

      const resultRgb = mixColors(ingredients, getColorById)
      const resultColor = createColorFromRgb(resultRgb)
      const distance = calculateColorDistanceFull(targetColor, resultColor)

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

  // Для 3 цветов - перебираем пропорции с шагом 0.1
  if (colors.length === 3) {
    for (let p1 = 0.1; p1 <= 0.8; p1 += 0.1) {
      for (let p2 = 0.1; p2 <= 0.8 - p1; p2 += 0.1) {
        const p3 = 1 - p1 - p2
        if (p3 < 0.1) continue

        const proportions = [p1, p2, p3]

        const ingredients: RecipeIngredient[] = colors.map((color, idx) => ({
          colorId: color.id,
          proportion: proportions[idx],
        }))

        const resultRgb = mixColors(ingredients, getColorById)
        const resultColor = createColorFromRgb(resultRgb)
        const distance = calculateColorDistanceFull(targetColor, resultColor)

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

  if (!bestResultColor) {
    // Fallback - равномерное распределение
    const ingredients: RecipeIngredient[] = colors.map((color) => ({
      colorId: color.id,
      proportion: 1 / colors.length,
    }))

    const resultRgb = mixColors(ingredients, getColorById)
    bestResultColor = createColorFromRgb(resultRgb)
    bestDistance = calculateColorDistanceFull(targetColor, bestResultColor)
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
): RecipeResult | UnreachableColorResult {
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
  const nearestInPalette = findNearestColor(targetColor, palette.colors)
  if (nearestInPalette.distance < EXACT_MATCH_THRESHOLD) {
    // Точное совпадение - используем один цвет
    const recipe: Recipe = {
      id: `recipe-${Date.now()}`,
      targetColor,
      resultColor: nearestInPalette.color,
      ingredients: [
        {
          colorId: nearestInPalette.color.id,
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
      distance: nearestInPalette.distance,
    }
  }

  // Перебираем комбинации от 1 до maxIngredients цветов
  let bestResult: {
    ingredients: RecipeIngredient[]
    resultColor: Color
    distance: number
  } | null = null

  for (let ingredientCount = 1; ingredientCount <= maxIngredients; ingredientCount++) {
    const combinations = generateCombinations(palette.colors, ingredientCount)

    for (const combination of combinations) {
      const colors = combination.map((idx) => palette.colors[idx])

      // Оптимизируем пропорции для этой комбинации
      const optimized = optimizeProportions(targetColor, colors)

      if (!bestResult || optimized.distance < bestResult.distance) {
        bestResult = {
          ingredients: colors.map((color, idx) => ({
            colorId: color.id,
            proportion: optimized.proportions[idx],
          })),
          resultColor: optimized.resultColor,
          distance: optimized.distance,
        }
      }

      // Если нашли точное совпадение, прекращаем поиск
      if (bestResult.distance < EXACT_MATCH_THRESHOLD) {
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

  // Проверяем, является ли цвет недостижимым
  if (bestResult.distance > UNREACHABLE_THRESHOLD) {
    const explanation = generateUnreachableExplanation(
      targetColor,
      bestResult.resultColor
    )

    return {
      targetColor,
      nearestColor: bestResult.resultColor,
      distance: bestResult.distance,
      explanation,
    }
  }

  // Создаем рецепт
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

  return {
    recipe,
    analysis,
    warnings,
    isExactMatch,
    distance: bestResult.distance,
  }
}

/**
 * Генерация объяснения, почему цвет недостижим
 * @param targetColor - Целевой цвет
 * @param nearestColor - Ближайший достижимый цвет
 * @param palette - Палитра пользователя
 * @returns Текстовое объяснение
 */
function generateUnreachableExplanation(
  targetColor: Color,
  nearestColor: Color
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

  if (reasons.length === 0) {
    return `Цвет недостижим с текущей палитрой. Ближайший достижимый цвет отличается на ${Math.round(nearestColor.hsl.s - targetColor.hsl.s)} единиц насыщенности.`
  }

  return `Цвет недостижим, так как ${reasons.join(', ')}. Ближайший достижимый цвет показан выше.`
}

