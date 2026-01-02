import { useState, useEffect } from 'react'
import Container from '@/components/Container/Container'
import { RecipeCard } from '@/components'
import { loadRecipes, deleteRecipe } from '@/services/recipeStorage'
import type { SavedRecipe } from '@/types'
import './SavedRecipesPage.css'

function SavedRecipesPage() {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Загрузка рецептов при монтировании компонента
  useEffect(() => {
    loadSavedRecipes()
  }, [])

  const loadSavedRecipes = () => {
    try {
      const savedRecipes = loadRecipes()
      setRecipes(savedRecipes)
    } catch (error) {
      console.error('Ошибка при загрузке рецептов:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (id: string) => {
    try {
      deleteRecipe(id)
      setRecipes((prev) => prev.filter((r) => r.id !== id))
    } catch (error) {
      console.error('Ошибка при удалении рецепта:', error)
      alert('Не удалось удалить рецепт')
    }
  }

  if (isLoading) {
    return (
      <Container>
        <div className="saved-recipes-page">
          <h1 className="saved-recipes-page__title">Сохранённые рецепты</h1>
          <p className="saved-recipes-page__loading">Загрузка...</p>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="saved-recipes-page">
        <h1 className="saved-recipes-page__title">Сохранённые рецепты</h1>
        <p className="saved-recipes-page__description">
          Ваши сохранённые рецепты и заметки
        </p>

        {recipes.length === 0 ? (
          <div className="saved-recipes-page__empty">
            <p className="saved-recipes-page__empty-text">
              У вас пока нет сохранённых рецептов.
            </p>
            <p className="saved-recipes-page__empty-hint">
              Сохраните рецепт на странице подбора, чтобы он появился здесь.
            </p>
          </div>
        ) : (
          <div className="saved-recipes-page__grid">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </Container>
  )
}

export default SavedRecipesPage

