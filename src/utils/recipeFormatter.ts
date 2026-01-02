import type { Recipe, RecipeIngredient, Color } from '@/types'

/**
 * Форматирование пропорций в виде частей
 * @param ingredients - Ингредиенты рецепта
 * @param getColorById - Функция для получения цвета по ID
 * @returns Строка с пропорциями в виде частей (например, "2 части красного, 1 часть синего")
 */
export function formatProportionsAsParts(
  ingredients: RecipeIngredient[],
  getColorById: (id: string) => Color | undefined
): string {
  if (ingredients.length === 0) {
    return 'Нет ингредиентов'
  }

  // Находим минимальную пропорцию для нормализации
  const minProportion = Math.min(...ingredients.map((i) => i.proportion))
  
  // Нормализуем пропорции до целых чисел (умножаем на коэффициент)
  const normalized = ingredients.map((ing) => {
    const ratio = ing.proportion / minProportion
    // Округляем до ближайшего простого числа (1, 2, 3, 4, 5, и т.д.)
    const rounded = Math.round(ratio * 10) / 10
    return {
      ...ing,
      normalizedProportion: rounded,
    }
  })

  // Находим общий множитель для приведения к целым числам
  const lcm = findLCM(normalized.map((n) => Math.round(n.normalizedProportion * 10)))

  const parts = normalized.map((ing) => {
    const color = getColorById(ing.colorId)
    const colorName = color?.name || color?.hex || `Цвет ${ing.colorId}`
    const partCount = Math.round((ing.normalizedProportion * lcm) / 10)
    
    return `${partCount} ${getPartWord(partCount)} ${colorName}`
  })

  return parts.join(', ')
}

/**
 * Форматирование пропорций в виде процентов
 * @param ingredients - Ингредиенты рецепта
 * @param getColorById - Функция для получения цвета по ID
 * @returns Строка с пропорциями в процентах
 */
export function formatProportionsAsPercentages(
  ingredients: RecipeIngredient[],
  getColorById: (id: string) => Color | undefined
): string {
  if (ingredients.length === 0) {
    return 'Нет ингредиентов'
  }

  const parts = ingredients.map((ing) => {
    const color = getColorById(ing.colorId)
    const colorName = color?.name || color?.hex || `Цвет ${ing.colorId}`
    const percentage = Math.round(ing.proportion * 100)
    
    return `${percentage}% ${colorName}`
  })

  return parts.join(', ')
}

/**
 * Форматирование пропорций в виде соотношения
 * @param ingredients - Ингредиенты рецепта
 * @returns Строка с соотношением (например, "2:1:1")
 */
export function formatProportionsAsRatio(
  ingredients: RecipeIngredient[]
): string {
  if (ingredients.length === 0) {
    return '0:0'
  }

  // Находим минимальную пропорцию для нормализации
  const minProportion = Math.min(...ingredients.map((i) => i.proportion))
  
  // Нормализуем и округляем до целых чисел
  const normalized = ingredients.map((ing) => {
    const ratio = ing.proportion / minProportion
    return Math.round(ratio * 10) / 10
  })

  // Находим общий множитель
  const lcm = findLCM(normalized.map((n) => Math.round(n * 10)))

  const ratios = normalized.map((n) => Math.round((n * lcm) / 10))
  
  return ratios.join(':')
}

/**
 * Полное форматирование рецепта в читаемый вид
 * @param recipe - Рецепт
 * @param getColorById - Функция для получения цвета по ID
 * @param format - Формат пропорций ('parts', 'percentages', 'ratio')
 * @returns Отформатированная строка рецепта
 */
export function formatRecipe(
  recipe: Recipe,
  getColorById: (id: string) => Color | undefined,
  format: 'parts' | 'percentages' | 'ratio' = 'parts'
): string {
  let proportionsText = ''

  switch (format) {
    case 'parts':
      proportionsText = formatProportionsAsParts(recipe.ingredients, getColorById)
      break
    case 'percentages':
      proportionsText = formatProportionsAsPercentages(recipe.ingredients, getColorById)
      break
    case 'ratio':
      proportionsText = formatProportionsAsRatio(recipe.ingredients)
      break
  }

  return `Смешайте: ${proportionsText}`
}

/**
 * Получение правильной формы слова "часть"
 * @param count - Количество
 * @returns Правильная форма слова
 */
function getPartWord(count: number): string {
  const lastDigit = count % 10
  const lastTwoDigits = count % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'частей'
  }

  if (lastDigit === 1) {
    return 'часть'
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'части'
  }

  return 'частей'
}

/**
 * Нахождение наименьшего общего кратного (НОК)
 * @param numbers - Массив чисел
 * @returns НОК
 */
function findLCM(numbers: number[]): number {
  if (numbers.length === 0) {
    return 1
  }

  if (numbers.length === 1) {
    return numbers[0]
  }

  let lcm = numbers[0]
  for (let i = 1; i < numbers.length; i++) {
    lcm = (lcm * numbers[i]) / findGCD(lcm, numbers[i])
  }

  return lcm
}

/**
 * Нахождение наибольшего общего делителя (НОД)
 * @param a - Первое число
 * @param b - Второе число
 * @returns НОД
 */
function findGCD(a: number, b: number): number {
  while (b !== 0) {
    const temp = b
    b = a % b
    a = temp
  }
  return a
}

