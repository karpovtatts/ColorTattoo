import { useNavigate } from 'react-router-dom'
import type { SavedRecipe } from '@/types'
import { useColorContext } from '@/contexts/ColorContext'
import Button from '@/components/Button/Button'
import ColorPreview from '@/components/ColorPreview/ColorPreview'
import './RecipeCard.css'

interface RecipeCardProps {
  recipe: SavedRecipe
  onDelete: (id: string) => void
}

function RecipeCard({ recipe, onDelete }: RecipeCardProps) {
  const navigate = useNavigate()
  const { setTargetColor } = useColorContext()

  const handleOpen = () => {
    // Устанавливаем целевой цвет и переходим на страницу рецепта
    setTargetColor(recipe.targetColor)
    navigate('/recipe')
  }

  const handleDelete = () => {
    if (window.confirm('Вы уверены, что хотите удалить этот рецепт?')) {
      onDelete(recipe.id)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="recipe-card">
      <div className="recipe-card__header">
        <div className="recipe-card__color">
          <ColorPreview
            color={recipe.targetColor}
            size="medium"
            showHex
          />
        </div>
        <div className="recipe-card__info">
          <h3 className="recipe-card__name">
            {recipe.name || `Рецепт для ${recipe.targetColor.hex}`}
          </h3>
          <div className="recipe-card__meta">
            <span className="recipe-card__date">
              {formatDate(recipe.createdAt)}
            </span>
            {recipe.notes && (
              <span className="recipe-card__has-notes">📝</span>
            )}
          </div>
        </div>
      </div>

      {recipe.notes && (
        <div className="recipe-card__notes">
          <p className="recipe-card__notes-text">{recipe.notes}</p>
        </div>
      )}

      <div className="recipe-card__ingredients">
        <span className="recipe-card__ingredients-label">Ингредиенты:</span>
        <span className="recipe-card__ingredients-count">
          {recipe.ingredients.length} {recipe.ingredients.length === 1 ? 'цвет' : 'цвета'}
        </span>
      </div>

      <div className="recipe-card__actions">
        <Button variant="primary" onClick={handleOpen}>
          Открыть
        </Button>
        <Button variant="danger" onClick={handleDelete}>
          Удалить
        </Button>
      </div>
    </div>
  )
}

export default RecipeCard

