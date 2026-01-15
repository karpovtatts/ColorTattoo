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
  const [excludedColorIds, setExcludedColorIds] = useState<Set<string>>(new Set())

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

    // Формируем палитру без исключенных цветов
    const filteredColors = palette.colors.filter((c) => !excludedColorIds.has(c.id))

    // Проверка на минимальное количество цветов после исключений
    if (filteredColors.length < 2) {
      setError(
        'После исключения цветов в палитре осталось меньше 2 оттенков. Верните некоторые цвета или добавьте новые в палитру.'
      )
      setRecipeResult(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = findRecipe(targetColor, { colors: filteredColors })
      setRecipeResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при подборе рецепта')
      setRecipeResult(null)
    } finally {
      setIsLoading(false)
    }
  }, [targetColor, palette, validation.isValid, excludedColorIds])

  // Функция для получения цвета по ID
  const getColorById = (id: string) => {
    return palette.colors.find((c) => c.id === id)
  }

  // Исключение ингредиента из рецепта
  const handleExcludeIngredient = (colorId: string) => {
    const color = getColorById(colorId)
    setExcludedColorIds((prev) => {
      const next = new Set(prev)
      next.add(colorId)
      return next
    })
    success(`Цвет ${color?.name || color?.hex || colorId} исключён из расчёта`)
  }

  // Восстановление исключенного цвета
  const handleRestoreExcluded = (colorId: string) => {
    const color = getColorById(colorId)
    setExcludedColorIds((prev) => {
      const next = new Set(prev)
      next.delete(colorId)
      return next
    })
    success(`Цвет ${color?.name || color?.hex || colorId} возвращён в палитру для расчёта`)
  }

  // Сброс всех исключений
  const handleResetExclusions = () => {
    setExcludedColorIds(new Set())
    success('Исключения сброшены')
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
                  const filteredColors = palette.colors.filter((c) => !excludedColorIds.has(c.id))
                  const result = findRecipe(targetColor, { colors: filteredColors })
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

        {/* Исключенные цвета */}
        {excludedColorIds.size > 0 && (
          <div className="recipe-page__excluded">
            <h2 className="recipe-page__section-title">Исключенные цвета</h2>
            <div className="recipe-page__excluded-list">
              {Array.from(excludedColorIds).map((id) => {
                const color = getColorById(id)
                if (!color) return null
                return (
                  <div key={id} className="recipe-page__excluded-chip">
                    <span className="recipe-page__excluded-chip-color" style={{ backgroundColor: color.hex }} />
                    <span className="recipe-page__excluded-chip-label">
                      {color.name || color.hex}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreExcluded(id)}
                    >
                      Вернуть
                    </Button>
                  </div>
                )
              })}
            </div>
            <div className="recipe-page__excluded-actions">
              <Button variant="secondary" onClick={handleResetExclusions}>
                Сбросить исключения
              </Button>
            </div>
          </div>
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
                  ⚠️ Точное совпадение недостижимо
                </h2>
                <p className="recipe-page__unreachable-explanation">
                  К сожалению, ваш целевой цвет не может быть точно получен из доступных цветов в палитре. 
                  Ниже показан максимально близкий вариант, который можно получить при смешивании.
                </p>
                {recipeResult.warnings
                  .filter((w) => w.type === 'unreachable')
                  .map((warning, idx) => (
                    <p key={idx} className="recipe-page__unreachable-explanation" style={{ fontStyle: 'italic', marginTop: '0.5rem' }}>
                      {warning.message}
                    </p>
                  ))}
                <div style={{ marginTop: '1.5rem' }}>
                  <ColorComparison
                    targetColor={targetColor}
                    resultColor={recipeResult.recipe.resultColor}
                    showDistance
                    showLabels
                    size="medium"
                  />
                </div>
              </div>
            ) : null}

            {/* Сравнение цветов */}
            <div className="recipe-page__comparison">
              <h2 className="recipe-page__section-title">Сравнение цветов</h2>
              <div className="recipe-page__info-note">
                <p>
                  <strong>Как это работает:</strong> Система подбирает рецепт смешивания вашего целевого цвета 
                  из цветов, доступных в вашей палитре. Если точное совпадение невозможно (цвет не находится 
                  в палитре или не может быть получен смешиванием), показывается максимально близкий вариант.
                </p>
                <p style={{ marginTop: '0.75rem' }}>
                  <strong>Примечание:</strong> Смешивание эмулирует физические тату-краски (субтрактивная модель). 
                  Метрика DeltaE показывает, насколько близки цвета визуально: &lt; 2 — практически неотличимы, 
                  2-5 — очень близко, 5-10 — похоже, &gt; 10 — заметная разница.
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
              {recipeResult.recipe.ingredients.length > 1 && (
                <div className="recipe-page__info-note" style={{ marginBottom: '1rem' }}>
                  <p>
                    <strong>Важно:</strong> Порядок добавления цветов имеет значение при смешивании тату-красок. 
                    Добавляйте цвета последовательно в указанном порядке, тщательно перемешивая каждый новый цвет 
                    с уже имеющейся смесью перед добавлением следующего.
                  </p>
                  <p style={{ marginTop: '0.5rem' }}>
                    <strong>Про части и капли:</strong> пропорции указаны в условных частях. Удобно считать, что 1 часть ≈ 1 капля одинакового объёма. 
                    Важно помнить, что реальные пропорции зависят от бренда, дисперсии пигмента, вязкости и техники набора краски.
                  </p>
                </div>
              )}
              <RecipeDisplay
                recipe={recipeResult.recipe}
                getColorById={getColorById}
                format="parts"
                showIngredients
                onExcludeIngredient={handleExcludeIngredient}
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

            {/* Общая информация о смешивании и безопасности */}
            <div className="recipe-page__info-note" style={{ marginTop: '1.5rem' }}>
              <h2 className="recipe-page__section-title">Важно про смешивание красок</h2>
              <ul>
                <li>
                  <strong>Аллергия:</strong> при смешивании разных пигментов растёт количество компонентов, а значит и риск аллергических реакций. 
                  Используйте только проверенные бренды и не экспериментируйте на клиентах без тестов.
                </li>
                <li>
                  <strong>Повторяемость оттенка:</strong> даже при схеме «24 части A и 1 часть B» сложно идеальное повторение — 
                  учитывайте объём, способ набора капель, скорость перемешивания и особенности конкретных партий красок.
                </li>
                <li>
                  <strong>Удаление тату:</strong> сложные миксы из нескольких пигментов, особенно с большим количеством тёмных/холодных компонентов, 
                  как правило, сложнее выводятся лазером и могут уходить неравномерно.
                </li>
                <li>
                  <strong>Про бренды и дисперсию:</strong> формулы в сервисе математические и не «знают» точную химию World Famous, Limitless или других марок. 
                  Используйте расчёт как ориентир, а финальный оттенок всегда уточняйте на палитре и на латексе/типсе.
                </li>
              </ul>
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

