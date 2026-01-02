// Базовые типы для цветов
export interface RGB {
  r: number // 0-255
  g: number // 0-255
  b: number // 0-255
}

export interface HSL {
  h: number // 0-360
  s: number // 0-100
  l: number // 0-100
}

export interface Color {
  id: string
  name?: string
  rgb: RGB
  hsl: HSL
  hex: string
}

// Рецепт смешивания
export interface RecipeIngredient {
  colorId: string
  proportion: number // часть от общего
}

export interface Recipe {
  id: string
  targetColor: Color
  resultColor: Color
  ingredients: RecipeIngredient[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Сохраненный рецепт с дополнительными полями
export interface SavedRecipe extends Recipe {
  name?: string // Название рецепта
  // notes уже есть в Recipe
}

// Палитра пользователя
export interface UserPalette {
  colors: Color[]
}

// Анализ цвета
export interface ColorAnalysis {
  isClean: boolean
  isDirty: boolean
  isWarm: boolean
  isCool: boolean
  warnings: string[]
  explanations: string[]
}

// Предупреждение
export interface Warning {
  type: 'dirty' | 'black_usage' | 'unreachable' | 'other'
  message: string
  severity: 'low' | 'medium' | 'high'
}

// Результат подбора рецепта
export interface RecipeResult {
  recipe: Recipe
  analysis: ColorAnalysis
  warnings: Warning[]
  isExactMatch: boolean
  distance?: number // расстояние до целевого цвета
}

// Результат для недостижимого цвета
export interface UnreachableColorResult {
  targetColor: Color
  nearestColor: Color
  distance: number
  explanation: string
}

