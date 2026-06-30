import type {
  Color,
  UserPalette,
  Recipe,
  RecipeIngredient,
  RecipeResult,
} from '@/types'
import {
  createColorFromRgb,
  createColorFromHex,
  isBlackInk,
  isColorful,
  getComplementaryColor,
  getColorNameFromHue,
} from '@/utils/colorOperations'
import { mixColorsSubtractive, mixColorsSubtractiveSequential } from '@/utils/colorPhysics'
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
// ПРИМЕЧАНИЕ: Больше не используется, так как черные чернила теперь полностью
// исключаются из палитры для хроматических целей на этапе фильтрации
// const BLACK_PENALTY = 25 // Штраф в DeltaE единицах (deprecated)

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

type RecipeCandidate = {
  ingredients: RecipeIngredient[]
  resultColor: Color
  distance: number
}

/**
 * Сборка полного RecipeResult (с оптимизацией порядка, проверкой
 * последовательного смешивания и предупреждениями) из кандидата,
 * найденного перебором комбинаций.
 */
function buildRecipeResult(
  targetColor: Color,
  candidate: RecipeCandidate,
  getColorById: (id: string) => Color | undefined,
  usablePalette: Color[]
): RecipeResult {
  // Оптимизируем порядок ингредиентов: сначала базовый/основной цвет
  // (самая большая доля), затем корректирующие — это обеспечивает более
  // предсказуемый результат при реальном смешивании
  const optimizedIngredients = optimizeIngredientOrder(
    candidate.ingredients,
    targetColor,
    getColorById
  )

  // Проверяем, влияет ли порядок на результат
  let finalResultColor = candidate.resultColor
  try {
    const sequentialResult = mixColorsSubtractiveSequential(optimizedIngredients, getColorById)
    const sequentialColor = createColorFromRgb(sequentialResult)
    const sequentialDistance = calculateColorDistancePerceptualFull(targetColor, sequentialColor)

    if (sequentialDistance < candidate.distance) {
      finalResultColor = sequentialColor
    }
  } catch (e) {
    console.warn('Failed to test sequential mixing:', e)
  }

  const recipe: Recipe = {
    id: `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    targetColor,
    resultColor: finalResultColor,
    ingredients: optimizedIngredients,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const { analysis, warnings } = analyzeColorAndRecipe(recipe, getColorById)

  const isExactMatch = candidate.distance < EXACT_MATCH_THRESHOLD
  const isUnreachable = candidate.distance > UNREACHABLE_THRESHOLD

  if (isUnreachable) {
    const explanation = generateUnreachableExplanation(
      targetColor,
      candidate.resultColor,
      candidate.ingredients,
      getColorById,
      usablePalette
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
    distance: candidate.distance,
  }
}

/**
 * Поиск рецепта для целевого цвета
 * @param targetColor - Целевой цвет
 * @param palette - Палитра пользователя
 * @param maxIngredients - Максимальное количество ингредиентов (по умолчанию 4)
 * @returns Массив вариантов рецепта (от самого точного до более простых), минимум один элемент
 */
export function findRecipe(
  targetColor: Color,
  palette: UserPalette,
  maxIngredients: number = MAX_INGREDIENTS
): RecipeResult[] {
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
    // Точное совпадение - используем один цвет, альтернатив тут не нужно
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

    const { analysis, warnings } = analyzeColorAndRecipe(recipe, getColorById)

    return [
      {
        recipe,
        analysis,
        warnings,
        isExactMatch: true,
        distance: minDistance,
      },
    ]
  }

  // Проверяем, является ли целевой цвет цветным (не ЧБ)
  const isTargetColorful = isColorful(targetColor)

  // Для хроматических цветов исключаем черные чернила из палитры
  // Это гарантирует, что алгоритм не будет использовать черный для затемнения
  // БЕЛЫЙ цвет НЕ исключается - он используется для осветления светлых цветов
  let usablePalette = palette.colors
  if (isTargetColorful) {
    usablePalette = palette.colors.filter((color) => !isBlackInk(color))

    if (usablePalette.length === 0) {
      throw new Error(
        'В палитре остались только черные чернила. Для цветных тату добавьте хроматические цвета в палитру.'
      )
    }

    if (usablePalette.length < 2) {
      throw new Error(
        'В палитре недостаточно цветных чернил (минимум 2). Добавьте больше цветов в палитру.'
      )
    }
  }

  // Перебираем комбинации от 1 до maxIngredients цветов, запоминая лучший
  // результат для КАЖДОГО количества ингредиентов — это даёт материал для
  // альтернатив (точнее vs проще), а не только один глобальный лучший
  const bestByCount = new Map<number, RecipeCandidate>()

  for (let ingredientCount = 1; ingredientCount <= maxIngredients; ingredientCount++) {
    const combinations = generateCombinations(usablePalette, ingredientCount)
    let bestForCount: RecipeCandidate | null = null

    for (const combination of combinations) {
      const colors = combination.map((idx) => usablePalette[idx])
      const optimized = optimizeProportions(targetColor, colors)

      if (!bestForCount || optimized.distance < bestForCount.distance) {
        bestForCount = {
          ingredients: colors.map((color, idx) => ({
            colorId: color.id,
            proportion: optimized.proportions[idx],
          })),
          resultColor: optimized.resultColor,
          distance: optimized.distance,
        }
      }

      if (optimized.distance < EXACT_MATCH_THRESHOLD) {
        break
      }
    }

    if (bestForCount) {
      bestByCount.set(ingredientCount, bestForCount)

      // Точнее, чем точное совпадение, не станет — больше ингредиентов не нужно
      if (bestForCount.distance < EXACT_MATCH_THRESHOLD) {
        break
      }
    }
  }

  if (bestByCount.size === 0) {
    throw new Error('Не удалось найти рецепт. Проверьте палитру.')
  }

  const entries = Array.from(bestByCount.entries()).map(([count, candidate]) => ({
    count,
    ...candidate,
  }))

  const best = entries.reduce((min, entry) => (entry.distance < min.distance ? entry : min))

  // Альтернативы: до 2 более простых вариантов (меньше ингредиентов), у которых
  // результат заметно отличается от самого точного — иначе показывать их бессмысленно
  const alternatives = [best]
  const byCountAscending = [...entries].sort((a, b) => a.count - b.count)

  for (const entry of byCountAscending) {
    if (alternatives.length >= 3) break
    if (alternatives.some((picked) => entry.count >= picked.count)) continue

    const resultDiff = calculateColorDistancePerceptualFull(entry.resultColor, best.resultColor)
    if (resultDiff < 1) continue

    alternatives.push(entry)
  }

  alternatives.sort((a, b) => a.distance - b.distance)

  return alternatives.map((candidate) =>
    buildRecipeResult(targetColor, candidate, getColorById, usablePalette)
  )
}

/**
 * Оптимизация порядка ингредиентов для лучшего результата смешивания
 * Рекомендуемый порядок: сначала основной цвет (самая большая доля), затем корректирующие
 * 
 * @param ingredients - Ингредиенты рецепта
 * @param targetColor - Целевой цвет (для определения, какой цвет ближе к цели)
 * @param getColorById - Функция для получения цвета по ID
 * @returns Ингредиенты в оптимальном порядке
 */
function optimizeIngredientOrder(
  ingredients: RecipeIngredient[],
  targetColor: Color,
  getColorById: (id: string) => Color | undefined
): RecipeIngredient[] {
  if (ingredients.length <= 1) {
    return ingredients
  }

  // Сортируем по убыванию пропорции (сначала основные цвета)
  // Если пропорции равны, приоритет отдаем цвету, который ближе к целевому
  const sorted = [...ingredients].sort((a, b) => {
    // Сначала по пропорции (убывание)
    if (Math.abs(a.proportion - b.proportion) > 0.001) {
      return b.proportion - a.proportion
    }
    
    // Если пропорции равны, сортируем по близости к целевому цвету
    const colorA = getColorById(a.colorId)
    const colorB = getColorById(b.colorId)
    
    if (!colorA || !colorB) {
      return 0
    }
    
    const distanceA = calculateColorDistancePerceptualFull(targetColor, colorA)
    const distanceB = calculateColorDistancePerceptualFull(targetColor, colorB)
    
    return distanceA - distanceB
  })

  return sorted
}

// Универсальные базовые цвета, которые есть у большинства тату-мастеров
const UNIVERSAL_BASE_COLORS: { hex: string; name: string }[] = [
  { hex: '#00A0D8', name: 'Голубой' },
  { hex: '#E01050', name: 'Малиновый' },
  { hex: '#F0C800', name: 'Жёлтый' },
  { hex: '#10B040', name: 'Зелёный' },
  { hex: '#7030A0', name: 'Фиолетовый' },
  { hex: '#F05808', name: 'Оранжевый' },
  { hex: '#C82010', name: 'Красный' },
  { hex: '#00B8A8', name: 'Бирюзовый' },
  { hex: '#FF70B0', name: 'Розовый' },
]

export type PaletteAdditionSuggestion = {
  color: Color
  recipe: RecipeResult
  distanceBefore: number
  distanceAfter: number
}

/**
 * Ищет одну краску, которую можно добавить к текущей палитре чтобы получить целевой цвет.
 * Возвращает null если улучшение незначительное или уже достижимо.
 */
export function findBestPaletteAddition(
  targetColor: Color,
  currentPalette: Color[],
  currentBestDistance: number
): PaletteAdditionSuggestion | null {
  if (currentBestDistance <= UNREACHABLE_THRESHOLD) return null

  let bestSuggestion: PaletteAdditionSuggestion | null = null
  let bestDistanceAfter = currentBestDistance

  for (const { hex, name } of UNIVERSAL_BASE_COLORS) {
    const candidateColor = createColorFromHex(hex, `suggestion-${hex.slice(1)}`, name)

    // Пропускаем если похожий оттенок уже есть в палитре
    const alreadyPresent = currentPalette.some((c) => {
      const hueDiff = Math.abs(c.hsl.h - candidateColor.hsl.h)
      const hueDistance = hueDiff > 180 ? 360 - hueDiff : hueDiff
      return hueDistance < 30 && c.hsl.s > 30
    })
    if (alreadyPresent) continue

    try {
      const extendedPalette: UserPalette = { colors: [...currentPalette, candidateColor] }
      const results = findRecipe(targetColor, extendedPalette, 3)
      const dist = results[0]?.distance
      if (results.length > 0 && dist !== undefined && dist < bestDistanceAfter) {
        bestDistanceAfter = dist
        bestSuggestion = {
          color: candidateColor,
          recipe: results[0],
          distanceBefore: currentBestDistance,
          distanceAfter: dist,
        }
      }
    } catch {
      // пропускаем этот кандидат
    }

    if (bestDistanceAfter < EXACT_MATCH_THRESHOLD) break
  }

  // Предлагаем только если улучшение значимое (минимум 5 единиц ΔE)
  if (!bestSuggestion || currentBestDistance - bestSuggestion.distanceAfter < 5) return null

  return bestSuggestion
}

/**
 * Генерация объяснения, почему цвет недостижим, и списка цветов для смешивания
 * Для хроматических цветов также предлагает добавить комплементарный цвет
 * @param targetColor - Целевой цвет
 * @param nearestColor - Ближайший достижимый цвет
 * @param ingredients - Ингредиенты рецепта
 * @param getColorById - Функция для получения цвета по ID
 * @param palette - Палитра пользователя (для проверки наличия комплементарного цвета)
 * @returns Текстовое объяснение с рецептом и рекомендациями
 */
function generateUnreachableExplanation(
  targetColor: Color,
  nearestColor: Color,
  ingredients: RecipeIngredient[],
  getColorById: (id: string) => Color | undefined,
  palette?: Color[]
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

  // Для хроматических цветов проверяем, нужен ли комплементарный цвет для затемнения
  let complementarySuggestion = ''
  if (isColorful(targetColor)) {
    // Если целевой цвет темнее, чем ближайший, возможно нужен комплементарный для затемнения
    if (targetColor.hsl.l < nearestColor.hsl.l - 10) {
      const complementaryHsl = getComplementaryColor(targetColor)
      const complementaryColorName = getColorNameFromHue(complementaryHsl.h)
      
      // Проверяем, есть ли близкий к комплементарному цвет в палитре
      let hasComplementary = false
      if (palette) {
        for (const color of palette) {
          if (isBlackInk(color)) continue // Пропускаем черные
          const hueDiff = Math.abs(color.hsl.h - complementaryHsl.h)
          const complementaryDiff = hueDiff > 180 ? 360 - hueDiff : hueDiff
          // Если есть цвет в пределах 30 градусов от комплементарного
          if (complementaryDiff < 30) {
            hasComplementary = true
            break
          }
        }
      }
      
      if (!hasComplementary) {
        complementarySuggestion = ` Для затемнения этого цвета без использования черного рекомендуется добавить в палитру оттенок, близкий к ${complementaryColorName} (комплементарный цвет).`
      }
    }
  }

  return `${reasonText}Чтобы получить максимально близкий цвет, нужно смешивать такие оттенки: ${colorList}.${complementarySuggestion}`
}

