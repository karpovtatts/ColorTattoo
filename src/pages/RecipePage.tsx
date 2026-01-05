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
  LoadingSpinner,
  ErrorMessage,
} from '@/components'
import { useColorContext } from '@/contexts/ColorContext'
import { usePaletteContext } from '@/contexts/PaletteContext'
import { useToastContext } from '@/contexts/ToastContext'
import { findRecipe } from '@/services/recipeFinder'
import { saveRecipe, createSavedRecipe } from '@/services/recipeStorage'
import type { RecipeResult } from '@/types'
import './RecipePage.css'

function RecipePage() {
  const navigate = useNavigate()
  const { targetColor } = useColorContext()
  const { palette, validation } = usePaletteContext()
  const { success, error: showError } = useToastContext()
  const [recipeResult, setRecipeResult] = useState<RecipeResult | null>(null)
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
      success('Рецепт успешно сохранён')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при сохранении рецепта'
      setError(errorMessage)
      showError(errorMessage)
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
          <ErrorMessage
            message={error}
            title="Ошибка"
            onRetry={() => {
              setError(null)
              if (targetColor) {
                setIsLoading(true)
                try {
                  const result = findRecipe(targetColor, palette)
                  setRecipeResult(result)
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Ошибка при подборе рецепта')
                } finally {
                  setIsLoading(false)
                }
              }
            }}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Загрузка */}
        {isLoading && <LoadingSpinner size="large" text="Подбор рецепта..." />}

        {/* Результат */}
        {!isLoading && !error && recipeResult && (
          <div className="recipe-page__result">
            {/* Проверяем, есть ли предупреждение о недостижимом цвете */}
            {recipeResult.warnings.some((w) => w.type === 'unreachable') ? (
              <div className="recipe-page__unreachable">
                <h2 className="recipe-page__section-title">
                  Цветов для достижения в палитре нет
                </h2>
                {recipeResult.warnings
                  .filter((w) => w.type === 'unreachable')
                  .map((warning, idx) => (
                    <p key={idx} className="recipe-page__unreachable-explanation">
                      {warning.message}
                    </p>
                  ))}
                <ColorComparison
                  targetColor={targetColor}
                  resultColor={recipeResult.recipe.resultColor}
                  showDistance
                  showLabels
                  size="medium"
                />
              </div>
            ) : null}

            {/* Сравнение цветов */}
            <div className="recipe-page__comparison">
              <h2 className="recipe-page__section-title">Сравнение цветов</h2>
              <div className="recipe-page__info-note">
                <p>
                  <strong>Примечание:</strong> Смешивание эмулирует физические тату-краски
                  (субтрактивная модель). Метрика DeltaE показывает перцептивное различие
                  цветов, как их видит человеческий глаз.
                </p>
              </div>
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
          </div>
        )}
      </div>

      {/* Модальное окно сохранения */}
      {recipeResult && (
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

