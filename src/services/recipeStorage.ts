import type { SavedRecipe, Recipe } from '@/types'

const STORAGE_KEY = 'savedRecipes'

/**
 * Сохранение рецепта в localStorage
 */
export function saveRecipe(recipe: SavedRecipe): void {
  try {
    const recipes = loadRecipes()
    const existingIndex = recipes.findIndex((r) => r.id === recipe.id)

    if (existingIndex >= 0) {
      // Обновляем существующий рецепт
      recipes[existingIndex] = {
        ...recipe,
        updatedAt: new Date(),
      }
    } else {
      // Добавляем новый рецепт
      recipes.push({
        ...recipe,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    const serialized = JSON.stringify(recipes)
    localStorage.setItem(STORAGE_KEY, serialized)
  } catch (error) {
    console.error('Error saving recipe to localStorage:', error)
    throw new Error('Не удалось сохранить рецепт')
  }
}

/**
 * Загрузка всех сохраненных рецептов из localStorage
 */
export function loadRecipes(): SavedRecipe[] {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY)
    if (!serialized) {
      return []
    }

    const data = JSON.parse(serialized) as SavedRecipe[]

    // Преобразуем строковые даты обратно в Date объекты
    return data.map((recipe) => ({
      ...recipe,
      createdAt: new Date(recipe.createdAt),
      updatedAt: new Date(recipe.updatedAt),
      targetColor: {
        ...recipe.targetColor,
      },
      resultColor: {
        ...recipe.resultColor,
      },
    }))
  } catch (error) {
    console.error('Error loading recipes from localStorage:', error)
    return []
  }
}

/**
 * Удаление рецепта по ID
 */
export function deleteRecipe(id: string): void {
  try {
    const recipes = loadRecipes()
    const filtered = recipes.filter((r) => r.id !== id)

    const serialized = JSON.stringify(filtered)
    localStorage.setItem(STORAGE_KEY, serialized)
  } catch (error) {
    console.error('Error deleting recipe from localStorage:', error)
    throw new Error('Не удалось удалить рецепт')
  }
}

/**
 * Обновление рецепта
 */
export function updateRecipe(
  id: string,
  updates: Partial<SavedRecipe>
): void {
  try {
    const recipes = loadRecipes()
    const index = recipes.findIndex((r) => r.id === id)

    if (index < 0) {
      throw new Error('Рецепт не найден')
    }

    recipes[index] = {
      ...recipes[index],
      ...updates,
      updatedAt: new Date(),
    }

    const serialized = JSON.stringify(recipes)
    localStorage.setItem(STORAGE_KEY, serialized)
  } catch (error) {
    console.error('Error updating recipe in localStorage:', error)
    throw new Error('Не удалось обновить рецепт')
  }
}

/**
 * Получение рецепта по ID
 */
export function getRecipeById(id: string): SavedRecipe | null {
  try {
    const recipes = loadRecipes()
    const recipe = recipes.find((r) => r.id === id)
    return recipe || null
  } catch (error) {
    console.error('Error getting recipe from localStorage:', error)
    return null
  }
}

/**
 * Преобразование Recipe в SavedRecipe
 */
export function createSavedRecipe(
  recipe: Recipe,
  name?: string,
  notes?: string
): SavedRecipe {
  return {
    ...recipe,
    name: name || `Рецепт для ${recipe.targetColor.hex}`,
    notes: notes || recipe.notes,
  }
}

