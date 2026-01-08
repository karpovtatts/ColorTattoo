import type { Recipe, Color } from '@/types'
import { ColorSwatch } from '@/components'
import { Button } from '@/components'
import { formatRecipe } from '@/utils/recipeFormatter'
import './RecipeDisplay.css'

interface RecipeDisplayProps {
  recipe: Recipe
  getColorById: (id: string) => Color | undefined
  format?: 'parts' | 'percentages' | 'ratio'
  showIngredients?: boolean
  onExcludeIngredient?: (colorId: string) => void
}

function RecipeDisplay({
  recipe,
  getColorById,
  format = 'parts',
  showIngredients = true,
  onExcludeIngredient,
}: RecipeDisplayProps) {
  const formattedRecipe = formatRecipe(recipe, getColorById, format)

  return (
    <div className="recipe-display">
      <div className="recipe-display__text">
        <p className="recipe-display__formatted">{formattedRecipe}</p>
      </div>
      {showIngredients && (
        <div className="recipe-display__ingredients">
          <h3 className="recipe-display__ingredients-title">Ингредиенты:</h3>
          <div className="recipe-display__ingredients-list">
            {recipe.ingredients.map((ingredient) => {
              const color = getColorById(ingredient.colorId)
              if (!color) return null

              return (
                <div key={ingredient.colorId} className="recipe-display__ingredient">
                  <ColorSwatch color={color} size="small" />
                  <div className="recipe-display__ingredient-info">
                    <span className="recipe-display__ingredient-name">
                      {color.name || color.hex}
                    </span>
                    <span className="recipe-display__ingredient-proportion">
                      {Math.round(ingredient.proportion * 100)}%
                    </span>
                  </div>
                  {onExcludeIngredient && (
                    <div className="recipe-display__ingredient-actions">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onExcludeIngredient(ingredient.colorId)}
                        aria-label={`Исключить ${color.name || color.hex} из рецепта`}
                      >
                        ✕ Исключить
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default RecipeDisplay

