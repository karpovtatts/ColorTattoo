// Константы приложения

export const APP_NAME = 'ColorTattoo'

export const STORAGE_KEYS = {
  USER_PALETTE: 'colortattoo_user_palette',
  SAVED_RECIPES: 'colortattoo_saved_recipes',
} as const

export const ROUTES = {
  HOME: '/',
  PALETTE: '/palette',
  RECIPE: '/recipe',
  SAVED: '/saved',
  IMAGE_ANALYSIS: '/image-analysis',
} as const

export const COLOR_FORMATS = {
  HEX: 'hex',
  RGB: 'rgb',
  HSL: 'hsl',
} as const

