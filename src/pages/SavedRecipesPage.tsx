import { useState, useEffect } from 'react'
import Container from '@/components/Container/Container'
import { RecipeCard, LoadingSpinner, ConfirmDialog } from '@/components'
import { useConfirm } from '@/hooks/useConfirm'
import { useToastContext } from '@/contexts/ToastContext'
import { loadRecipes, deleteRecipe } from '@/services/recipeStorage'
import type { SavedRecipe } from '@/types'
import './SavedRecipesPage.css'

function SavedRecipesPage() {
  const { success, error: showError } = useToastContext()
  const { confirmState, handleConfirm, handleCancel, confirm } = useConfirm()
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
      showError('Не удалось загрузить сохранённые рецепты')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const recipe = recipes.find((r) => r.id === id)
    const result = await confirm({
      title: 'Удалить рецепт?',
      message: `Вы уверены, что хотите удалить рецепт "${
        recipe?.name || recipe?.targetColor.hex || 'этот рецепт'
      }"? Это действие нельзя отменить.`,
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger',
    })

    if (result) {
      setDeletingId(id)
      try {
        deleteRecipe(id)
        setRecipes((prev) => prev.filter((r) => r.id !== id))
        success('Рецепт успешно удалён')
      } catch (error) {
        console.error('Ошибка при удалении рецепта:', error)
        showError('Не удалось удалить рецепт')
      } finally {
        setDeletingId(null)
      }
    }
  }

  if (isLoading) {
    return (
      <Container>
        <div className="saved-recipes-page">
          <h1 className="saved-recipes-page__title">Сохранённые рецепты</h1>
          <LoadingSpinner size="large" text="Загрузка рецептов..." />
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
                isDeleting={deletingId === recipe.id}
              />
            ))}
          </div>
        )}

        {confirmState && (
          <ConfirmDialog
            isOpen={!!confirmState}
            title={confirmState.title}
            message={confirmState.message}
            confirmText={confirmState.confirmText}
            cancelText={confirmState.cancelText}
            variant={confirmState.variant}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )}
      </div>
    </Container>
  )
}

export default SavedRecipesPage

