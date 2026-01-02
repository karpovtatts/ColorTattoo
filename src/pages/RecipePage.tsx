import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Container from '@/components/Container/Container'
import { Button, ColorPreview, ColorSwatch, TemperatureIndicator } from '@/components'
import { useColorContext } from '@/contexts/ColorContext'
import { usePaletteContext } from '@/contexts/PaletteContext'
import { findRecipe } from '@/services/recipeFinder'
import { formatRecipe } from '@/utils/recipeFormatter'
import type { RecipeResult, UnreachableColorResult } from '@/types'
import './RecipePage.css'

function RecipePage() {
  const navigate = useNavigate()
  const { targetColor } = useColorContext()
  const { palette, validation } = usePaletteContext()
  const [recipeResult, setRecipeResult] = useState<
    RecipeResult | UnreachableColorResult | null
  >(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Подбор рецепта при изменении целевого цвета или палитры
  useEffect(() => {
    if (!targetColor) {
      setRecipeResult(null)
      return
    }

    // Проверяем валидность палитры
    if (!validation.isValid) {
      setError('Палитра невалидна. Добавьте минимум 2 уникальных цвета.')
      setRecipeResult(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = findRecipe(targetColor, palette)
      setRecipeResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при подборе рецепта')
      setRecipeResult(null)
    } finally {
      setIsLoading(false)
    }
  }, [targetColor, palette, validation.isValid])

  // Функция для получения цвета по ID
  const getColorById = (id: string) => {
    return palette.colors.find((c) => c.id === id)
  }

  if (!targetColor) {
    return (
      <Container>
        <div className="recipe-page">
          <h1 className="recipe-page__title">Подбор рецепта</h1>
          <p className="recipe-page__description">
            Выберите целевой цвет для получения рецепта смешивания
          </p>
          <div className="recipe-page__empty">
            <p className="recipe-page__empty-text">
              Целевой цвет не выбран. Вернитесь на главную страницу и введите цвет.
            </p>
            <Button variant="primary" onClick={() => navigate('/')}>
              Выбрать цвет
            </Button>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="recipe-page">
        <h1 className="recipe-page__title">Подбор рецепта</h1>

        {/* Целевой цвет */}
        <div className="recipe-page__target-color">
          <h2 className="recipe-page__section-title">Целевой цвет</h2>
          <ColorPreview
            color={targetColor}
            size="large"
            showHex
            showRgb
            label="Выбранный цвет"
          />
        </div>

        {/* Ошибка */}
        {error && (
          <div className="recipe-page__error">
            <p className="recipe-page__error-text">{error}</p>
            <Button variant="primary" onClick={() => navigate('/palette')}>
              Настроить палитру
            </Button>
          </div>
        )}

        {/* Загрузка */}
        {isLoading && (
          <div className="recipe-page__loading">
            <p className="recipe-page__loading-text">Подбор рецепта...</p>
          </div>
        )}

        {/* Результат */}
        {!isLoading && !error && recipeResult && (
          <div className="recipe-page__result">
            {/* Недостижимый цвет */}
            {'explanation' in recipeResult ? (
              <div className="recipe-page__unreachable">
                <h2 className="recipe-page__section-title">
                  Цвет недостижим с текущей палитрой
                </h2>
                <p className="recipe-page__unreachable-explanation">
                  {recipeResult.explanation}
                </p>
                <div className="recipe-page__color-comparison">
                  <div className="recipe-page__color-item">
                    <h3 className="recipe-page__color-label">Целевой цвет</h3>
                    <ColorPreview
                      color={recipeResult.targetColor}
                      size="medium"
                      showHex
                    />
                  </div>
                  <div className="recipe-page__color-item">
                    <h3 className="recipe-page__color-label">Ближайший достижимый</h3>
                    <ColorPreview
                      color={recipeResult.nearestColor}
                      size="medium"
                      showHex
                    />
                  </div>
                </div>
                <p className="recipe-page__distance">
                  Расстояние: {Math.round(recipeResult.distance)} единиц
                </p>
              </div>
            ) : (
              <>
                {/* Результирующий цвет */}
                <div className="recipe-page__result-color">
                  <h2 className="recipe-page__section-title">Результирующий цвет</h2>
                  <ColorPreview
                    color={recipeResult.recipe.resultColor}
                    size="large"
                    showHex
                    showRgb
                    label={
                      recipeResult.isExactMatch
                        ? 'Точное совпадение'
                        : `Близкое совпадение (расстояние: ${Math.round(recipeResult.distance || 0)})`
                    }
                  />
                </div>

                {/* Рецепт */}
                <div className="recipe-page__recipe">
                  <h2 className="recipe-page__section-title">Рецепт смешивания</h2>
                  <p className="recipe-page__recipe-text">
                    {formatRecipe(recipeResult.recipe, getColorById, 'parts')}
                  </p>
                  <div className="recipe-page__ingredients">
                    <h3 className="recipe-page__ingredients-title">Ингредиенты:</h3>
                    <div className="recipe-page__ingredients-list">
                      {recipeResult.recipe.ingredients.map((ingredient) => {
                        const color = getColorById(ingredient.colorId)
                        if (!color) return null

                        return (
                          <div key={ingredient.colorId} className="recipe-page__ingredient">
                            <ColorSwatch color={color} size="small" />
                            <div className="recipe-page__ingredient-info">
                              <span className="recipe-page__ingredient-name">
                                {color.name || color.hex}
                              </span>
                              <span className="recipe-page__ingredient-proportion">
                                {Math.round(ingredient.proportion * 100)}%
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Анализ цвета */}
                <div className="recipe-page__analysis">
                  <h2 className="recipe-page__section-title">Анализ цвета</h2>
                  <div className="recipe-page__analysis-content">
                    <div className="recipe-page__analysis-item">
                      <span className="recipe-page__analysis-label">Чистота:</span>
                      <span
                        className={`recipe-page__analysis-value recipe-page__analysis-value--${
                          recipeResult.analysis.isClean ? 'clean' : 'dirty'
                        }`}
                      >
                        {recipeResult.analysis.isClean ? '✓ Чистый' : '⚠ Грязный'}
                      </span>
                    </div>
                    <div className="recipe-page__analysis-item">
                      <span className="recipe-page__analysis-label">Температура:</span>
                      <TemperatureIndicator
                        color={recipeResult.recipe.resultColor}
                        size="medium"
                      />
                    </div>
                    {recipeResult.analysis.explanations.length > 0 && (
                      <div className="recipe-page__explanations">
                        {recipeResult.analysis.explanations.map((explanation, idx) => (
                          <p key={idx} className="recipe-page__explanation">
                            {explanation}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Предупреждения */}
                {recipeResult.warnings.length > 0 && (
                  <div className="recipe-page__warnings">
                    <h2 className="recipe-page__section-title">Предупреждения</h2>
                    {recipeResult.warnings.map((warning, idx) => (
                      <div
                        key={idx}
                        className={`recipe-page__warning recipe-page__warning--${warning.severity}`}
                      >
                        <p className="recipe-page__warning-text">{warning.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Container>
  )
}

export default RecipePage

