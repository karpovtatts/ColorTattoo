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

