import { useState, useId } from 'react'
import type { Recipe, Color } from '@/types'
import { Button } from '@/components'
import {
  formatRecipe,
  calculateIngredientVolumes,
  formatIngredientVolume,
} from '@/utils/recipeFormatter'
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
  const uid = useId()
  const volumeInputId = `recipe-volume-${uid}`

  const [volumeInput, setVolumeInput] = useState('')
  const [volumeUnit, setVolumeUnit] = useState<'ml' | 'drops'>('ml')

  const totalVolume = parseFloat(volumeInput.replace(',', '.'))
  const hasVolume = !isNaN(totalVolume) && totalVolume > 0
  const ingredientVolumes = hasVolume
    ? calculateIngredientVolumes(recipe.ingredients, totalVolume)
    : null

  const formattedRecipe = hasVolume
    ? formatRecipe(recipe, getColorById, format)
    : null

  if (!showIngredients) return null

  return (
    <div className="recipe-display">
      {/* Header: title + volume input */}
      <div className="recipe-display__header">
        <span className="recipe-display__label">Ингредиенты</span>
        <div className="recipe-display__volume">
          <label htmlFor={volumeInputId} className="recipe-display__volume-label">
            Объём:
          </label>
          <input
            id={volumeInputId}
            type="text"
            inputMode="decimal"
            placeholder="3"
            value={volumeInput}
            onChange={(e) => setVolumeInput(e.target.value)}
            className="recipe-display__volume-input"
          />
          <select
            value={volumeUnit}
            onChange={(e) => setVolumeUnit(e.target.value as 'ml' | 'drops')}
            className="recipe-display__volume-unit"
            aria-label="Единица измерения"
          >
            <option value="ml">мл</option>
            <option value="drops">капель</option>
          </select>
        </div>
      </div>

      {/* Ingredient rows */}
      <div className="recipe-display__rows">
        {recipe.ingredients.map((ingredient, index) => {
          const color = getColorById(ingredient.colorId)
          if (!color) return null
          const pct = Math.round(ingredient.proportion * 100)
          const vol = ingredientVolumes?.[index]

          return (
            <div key={ingredient.colorId} className="recipe-display__row">
              <span
                className="recipe-display__row-order"
                aria-hidden={recipe.ingredients.length <= 1}
                style={recipe.ingredients.length <= 1 ? { visibility: 'hidden' } : undefined}
              >
                {index + 1}
              </span>
              <span
                className="recipe-display__row-swatch"
                style={{ backgroundColor: color.hex }}
                aria-hidden="true"
              />
              <span className="recipe-display__row-name">{color.name || color.hex}</span>
              <div className="recipe-display__row-bar">
                <div
                  className="recipe-display__row-bar-fill"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: color.hex,
                  }}
                />
              </div>
              <code className="recipe-display__row-pct">{pct}%</code>
              {vol !== undefined && (
                <code className="recipe-display__row-vol">
                  {formatIngredientVolume(vol, volumeUnit)}
                </code>
              )}
              {onExcludeIngredient && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExcludeIngredient(ingredient.colorId)}
                  aria-label={`Убрать ${color.name || color.hex}`}
                  className="recipe-display__row-exclude"
                >
                  ×
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary line — only when volume entered */}
      {formattedRecipe && (
        <p className="recipe-display__summary">{formattedRecipe}</p>
      )}
    </div>
  )
}

export default RecipeDisplay
