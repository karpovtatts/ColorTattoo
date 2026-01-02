import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Container from '@/components/Container/Container'
import {
  Button,
  ColorPreview,
  ColorComparison,
  RecipeDisplay,
  WarningBadge,
  AnalysisSection,
  SaveRecipeModal,
} from '@/components'
import { useColorContext } from '@/contexts/ColorContext'
import { usePaletteContext } from '@/contexts/PaletteContext'
import { findRecipe } from '@/services/recipeFinder'
import { saveRecipe, createSavedRecipe } from '@/services/recipeStorage'
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
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)

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

  // Обработка сохранения рецепта
  const handleSaveRecipe = (name: string, notes: string) => {
    if (!recipeResult || 'explanation' in recipeResult) {
      return
    }

    try {
      const savedRecipe = createSavedRecipe(recipeResult.recipe, name, notes)
      saveRecipe(savedRecipe)
      setIsSaveModalOpen(false)
      // Можно добавить уведомление об успешном сохранении
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при сохранении рецепта')
    }
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
                <ColorComparison
                  targetColor={recipeResult.targetColor}
                  resultColor={recipeResult.nearestColor}
                  showDistance
                  showLabels
                  size="medium"
                />
              </div>
            ) : (
              <>
                {/* Сравнение цветов */}
                <div className="recipe-page__comparison">
                  <h2 className="recipe-page__section-title">Сравнение цветов</h2>
                  <ColorComparison
                    targetColor={targetColor}
                    resultColor={recipeResult.recipe.resultColor}
                    showDistance
                    showLabels
                    size="large"
                  />
                </div>

                {/* Рецепт */}
                <div className="recipe-page__recipe">
                  <h2 className="recipe-page__section-title">Рецепт смешивания</h2>
                  <RecipeDisplay
                    recipe={recipeResult.recipe}
                    getColorById={getColorById}
                    format="parts"
                    showIngredients
                  />
                </div>

                {/* Анализ цвета */}
                <div className="recipe-page__analysis">
                  <h2 className="recipe-page__section-title">Анализ цвета</h2>
                  <AnalysisSection
                    analysis={recipeResult.analysis}
                    resultColor={recipeResult.recipe.resultColor}
                  />
                </div>

                {/* Предупреждения */}
                {recipeResult.warnings.length > 0 && (
                  <div className="recipe-page__warnings">
                    <h2 className="recipe-page__section-title">Предупреждения</h2>
                    {recipeResult.warnings.map((warning, idx) => (
                      <WarningBadge key={idx} warning={warning} showIcon />
                    ))}
                  </div>
                )}

                {/* Кнопка сохранения */}
                <div className="recipe-page__actions">
                  <Button
                    variant="primary"
                    onClick={() => setIsSaveModalOpen(true)}
                  >
                    Сохранить рецепт
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Модальное окно сохранения */}
      {recipeResult && !('explanation' in recipeResult) && (
        <SaveRecipeModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onSave={handleSaveRecipe}
          recipe={recipeResult.recipe}
        />
      )}
    </Container>
  )
}

export default RecipePage

