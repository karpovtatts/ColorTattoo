import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { SketchPicker } from 'react-color'
import type { ColorResult } from 'react-color'
import Container from '@/components/Container/Container'
import {
  Button,
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
import { findRecipe, findBestPaletteAddition } from '@/services/recipeFinder'
import type { PaletteAdditionSuggestion } from '@/services/recipeFinder'
import { saveRecipe, createSavedRecipe } from '@/services/recipeStorage'
import { createColorFromHsl, createColorFromRgb, getComplementaryColorForHarmony, getTriadicColors, getAnalogousColors } from '@/utils/colorOperations'
import type { RecipeResult, Color } from '@/types'
import './RecipePage.css'

function isSilverColor(color: Color): boolean {
  // Сильвера: ахроматические чернила (S < 10%), не чистый чёрный (L > 15%) и не чистый белый (L < 95%)
  return color.hsl.s < 10 && color.hsl.l > 15 && color.hsl.l < 95
}

function distanceLabel(d: number): { text: string; level: 'exact' | 'close' | 'similar' | 'different' | 'far' } {
  if (d < 2)  return { text: 'не отличить',          level: 'exact' }
  if (d < 5)  return { text: 'очень похоже',         level: 'close' }
  if (d < 10) return { text: 'похоже',               level: 'similar' }
  if (d < 20) return { text: 'заметно отличается',   level: 'different' }
  return       { text: 'значительно отличается',     level: 'far' }
}

function RecipePage() {
  const navigate = useNavigate()
  const { targetColor, setTargetColor } = useColorContext()
  const { palette, validation } = usePaletteContext()
  const { success, error: showError } = useToastContext()

  const [pickerOpen, setPickerOpen] = useState(false)

  // Recipe state
  const [recipeResultMain, setRecipeResultMain] = useState<RecipeResult | null>(null)
  const [recipeResultSilver, setRecipeResultSilver] = useState<RecipeResult | null>(null)
  const [hasSilversInPalette, setHasSilversInPalette] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recipeToSave, setRecipeToSave] = useState<RecipeResult | null>(null)
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [excludedColorIds, setExcludedColorIds] = useState<Set<string>>(new Set())
  const [paletteAdditionSuggestion, setPaletteAdditionSuggestion] =
    useState<PaletteAdditionSuggestion | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Рандомный цвет при первом заходе
  const colorInitializedRef = useRef(false)
  useEffect(() => {
    if (!targetColor && !colorInitializedRef.current) {
      colorInitializedRef.current = true
      const h = Math.floor(Math.random() * 360)
      const s = 50 + Math.floor(Math.random() * 40)
      const l = 35 + Math.floor(Math.random() * 30)
      setTargetColor(createColorFromHsl({ h, s, l }))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Recipe calculation
  useEffect(() => {
    if (!targetColor) {
      setRecipeResultMain(null)
      setRecipeResultSilver(null)
      setPaletteAdditionSuggestion(null)
      return
    }

    if (!validation.isValid) {
      setError('Палитра невалидна. Добавьте минимум 2 уникальных цвета.')
      setRecipeResultMain(null)
      setRecipeResultSilver(null)
      return
    }

    const filteredColors = palette.colors.filter((c) => !excludedColorIds.has(c.id))

    if (filteredColors.length < 2) {
      setError(
        'После исключения цветов в палитре осталось меньше 2 оттенков. Верните некоторые цвета или добавьте новые в палитру.'
      )
      setRecipeResultMain(null)
      setRecipeResultSilver(null)
      setIsLoading(false)
      return
    }

    const hasSilvers = filteredColors.some(isSilverColor)
    setHasSilversInPalette(hasSilvers)

    setIsLoading(true)
    setError(null)
    setPaletteAdditionSuggestion(null)

    try {
      // Колонка 1: только цветные краски (без сильверов)
      const colorsMain = filteredColors.filter((c) => !isSilverColor(c))
      let mainResult: RecipeResult | null = null
      if (colorsMain.length >= 2) {
        mainResult = findRecipe(targetColor, { colors: colorsMain })[0] ?? null
      }
      setRecipeResultMain(mainResult)

      // Колонка 2: с сильверами (все цвета)
      const silverResult = findRecipe(targetColor, { colors: filteredColors })[0] ?? null
      setRecipeResultSilver(silverResult)

      // Предложение добавить краску — по лучшему результату
      const bestResult = silverResult ?? mainResult
      if (bestResult && (bestResult.distance ?? 0) > 15) {
        const suggestion = findBestPaletteAddition(targetColor, filteredColors, bestResult.distance ?? 0)
        setPaletteAdditionSuggestion(suggestion)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при подборе рецепта')
      setRecipeResultMain(null)
      setRecipeResultSilver(null)
    } finally {
      setIsLoading(false)
    }
  }, [targetColor, palette, validation.isValid, excludedColorIds, retryCount])

  const handleSketchChange = (result: ColorResult) => {
    const color = createColorFromRgb({
      r: result.rgb.r ?? 0,
      g: result.rgb.g ?? 0,
      b: result.rgb.b ?? 0,
    })
    setTargetColor(color)
  }

  // Recipe handlers
  const getColorById = useCallback(
    (id: string): Color | undefined => palette.colors.find((c) => c.id === id),
    [palette.colors]
  )

  const getColorByIdExtended = useCallback(
    (id: string): Color | undefined => {
      if (paletteAdditionSuggestion && id === paletteAdditionSuggestion.color.id) {
        return paletteAdditionSuggestion.color
      }
      return palette.colors.find((c) => c.id === id)
    },
    [palette.colors, paletteAdditionSuggestion]
  )

  const handleExcludeIngredient = (colorId: string) => {
    const color = getColorById(colorId)
    setExcludedColorIds((prev) => {
      const next = new Set(prev)
      next.add(colorId)
      return next
    })
    success(`Цвет ${color?.name || color?.hex || colorId} исключён из расчёта`)
  }

  const handleRestoreExcluded = (colorId: string) => {
    const color = getColorById(colorId)
    setExcludedColorIds((prev) => {
      const next = new Set(prev)
      next.delete(colorId)
      return next
    })
    success(`Цвет ${color?.name || color?.hex || colorId} возвращён в палитру для расчёта`)
  }

  const handleResetExclusions = () => {
    setExcludedColorIds(new Set())
    success('Исключения сброшены')
  }

  const handleSaveRecipe = (name: string, notes: string) => {
    if (!recipeToSave) return
    try {
      const savedRecipe = createSavedRecipe(recipeToSave.recipe, name, notes)
      saveRecipe(savedRecipe)
      setIsSaveModalOpen(false)
      setRecipeToSave(null)
      success('Рецепт успешно сохранён')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при сохранении рецепта'
      setError(errorMessage)
      showError(errorMessage)
    }
  }

  // Сильвера реально улучшают результат если ΔE хотя бы на 1 единицу меньше
  const silverImproves =
    hasSilversInPalette &&
    recipeResultSilver !== null &&
    recipeResultMain !== null &&
    (recipeResultSilver.distance ?? 0) < (recipeResultMain.distance ?? 0) - 1

  // Лучший из двух результатов — для анализа в герое
  const bestResult = (silverImproves ? recipeResultSilver : null) ?? recipeResultMain

  const harmonyColors = useMemo(() => {
    if (!targetColor) return { comp: [] as Color[], triadic: [] as Color[], analogous: [] as Color[] }
    const comp = [getComplementaryColorForHarmony(targetColor)]
    const triadic = getTriadicColors(targetColor).filter((c) => c.hex !== targetColor.hex)
    const analogous = getAnalogousColors(targetColor).filter((c) => c.hex !== targetColor.hex)
    return { comp, triadic, analogous }
  }, [targetColor])

  const presetHexes = useMemo(() => palette.colors.map((c) => c.hex), [palette.colors])

  return (
    <Container>
      <div className="recipe-page">
        <h1 className="recipe-page__title">Подбор рецепта</h1>

        {!validation.isValid && (
          <div className="recipe-page__palette-hint">
            <span>Добавьте краски в палитру — рецепт рассчитается автоматически.</span>
            <Button variant="outline" size="sm" onClick={() => navigate('/palette')}>
              Настроить палитру
            </Button>
          </div>
        )}


        {error && (
          <ErrorMessage
            message={error}
            title="Ошибка"
            onRetry={() => {
              setError(null)
              setRetryCount((c) => c + 1)
            }}
            onDismiss={() => setError(null)}
          />
        )}

        {excludedColorIds.size > 0 && (
          <div className="recipe-page__excluded">
            <div className="recipe-page__excluded-list">
              {Array.from(excludedColorIds).map((id) => {
                const color = getColorById(id)
                if (!color) return null
                return (
                  <div key={id} className="recipe-page__excluded-chip">
                    <span className="recipe-page__excluded-chip-color" style={{ backgroundColor: color.hex }} />
                    <span className="recipe-page__excluded-chip-label">{color.name || color.hex}</span>
                    <Button variant="outline" size="sm" onClick={() => handleRestoreExcluded(id)}>
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

        {isLoading && <LoadingSpinner size="large" text="Подбор рецепта..." />}

        {!isLoading && !error && bestResult && (
          <div className="recipe-page__result">

            {/* Герой: свотч | [пикер] | анализ */}
            <div className={`recipe-page__hero${pickerOpen ? ' recipe-page__hero--picker-open' : ''}`}>
              <div className="recipe-page__hero-left">
                <button
                  type="button"
                  className={`recipe-page__hero-color${pickerOpen ? ' recipe-page__hero-color--open' : ''}`}
                  onClick={() => setPickerOpen((v) => !v)}
                  aria-label="Изменить целевой цвет"
                >
                  <div
                    className="recipe-page__hero-swatch"
                    style={{ backgroundColor: targetColor!.hex }}
                  />
                  <div className="recipe-page__hero-color-info">
                    <span className="recipe-page__hero-label">Целевой цвет</span>
                    <code className="recipe-page__hero-hex">{targetColor!.hex}</code>
                    <code className="recipe-page__hero-rgb">
                      rgb({targetColor!.rgb.r}, {targetColor!.rgb.g}, {targetColor!.rgb.b})
                    </code>
                  </div>
                </button>
                <div className="recipe-page__hero-harmonies">
                  <div className="recipe-page__hero-harmony-group">
                    {harmonyColors.comp.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        className="recipe-page__hero-harmony-dot"
                        style={{ backgroundColor: c.hex }}
                        title={c.hex}
                        onClick={() => { setTargetColor(c); setExcludedColorIds(new Set()) }}
                      />
                    ))}
                  </div>
                  <div className="recipe-page__hero-harmony-sep" />
                  <div className="recipe-page__hero-harmony-group">
                    {harmonyColors.triadic.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        className="recipe-page__hero-harmony-dot"
                        style={{ backgroundColor: c.hex }}
                        title={c.hex}
                        onClick={() => { setTargetColor(c); setExcludedColorIds(new Set()) }}
                      />
                    ))}
                  </div>
                  <div className="recipe-page__hero-harmony-sep" />
                  <div className="recipe-page__hero-harmony-group">
                    {harmonyColors.analogous.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        className="recipe-page__hero-harmony-dot"
                        style={{ backgroundColor: c.hex }}
                        title={c.hex}
                        onClick={() => { setTargetColor(c); setExcludedColorIds(new Set()) }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="recipe-page__hero-picker">
                {pickerOpen && (
                  <SketchPicker
                    color={{ r: targetColor!.rgb.r, g: targetColor!.rgb.g, b: targetColor!.rgb.b }}
                    onChange={handleSketchChange}
                    presetColors={presetHexes}
                    disableAlpha
                  />
                )}
              </div>
              <div className="recipe-page__hero-analysis">
                <h2 className="recipe-page__section-title">Анализ цвета</h2>
                <AnalysisSection
                  analysis={bestResult!.analysis}
                  resultColor={bestResult!.recipe.resultColor}
                />
              </div>
            </div>

            {/* Три колонки рецептов */}
            <div className="recipe-page__columns">

              {/* Колонка 1: Из палитры (без сильверов) */}
              <div className="recipe-page__column">
                <div className="recipe-page__column-header">
                  <h3 className="recipe-page__column-title">Из палитры</h3>
                  <span className="recipe-page__column-subtitle">только цветные краски</span>
                </div>
                {recipeResultMain ? (
                  <>
                    {recipeResultMain.recipe.ingredients.length > 1 && (
                      <details className="recipe-page__recipe-info">
                        <summary className="recipe-page__recipe-info-toggle">ℹ️ О порядке и пропорциях</summary>
                        <div className="recipe-page__recipe-info-body">
                          <p><strong>Важно:</strong> добавляйте цвета в указанном порядке, тщательно перемешивая каждый новый цвет.</p>
                          <p><strong>Про части и капли:</strong> 1 часть ≈ 1 капля одинакового объёма.</p>
                        </div>
                      </details>
                    )}
                    <RecipeDisplay
                      recipe={recipeResultMain.recipe}
                      getColorById={getColorById}
                      format="parts"
                      showIngredients
                      onExcludeIngredient={handleExcludeIngredient}
                    />
                    <div className="recipe-page__column-footer">
                      <div className="recipe-page__column-result">
                        <span className="recipe-page__result-chip" style={{ backgroundColor: recipeResultMain.recipe.resultColor.hex }} />
                        <span className={`recipe-page__result-label recipe-page__result-label--${distanceLabel(recipeResultMain.distance ?? 0).level}`}>
                          {distanceLabel(recipeResultMain.distance ?? 0).text}
                        </span>
                      </div>
                      {recipeResultMain.warnings.filter((w) => w.type !== 'unreachable').map((w, i) => (
                        <WarningBadge key={`main-${w.type}-${i}`} warning={w} showIcon />
                      ))}
                      <Button variant="outline" size="sm" onClick={() => { setRecipeToSave(recipeResultMain); setIsSaveModalOpen(true) }}>
                        Сохранить рецепт
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="recipe-page__column-empty">
                    Все цвета в палитре — сильвера, цветных красок нет
                  </div>
                )}
              </div>

              {/* Колонка 2: С сильверами */}
              <div className="recipe-page__column recipe-page__column--silver">
                <div className="recipe-page__column-header">
                  <h3 className="recipe-page__column-title">С сильверами</h3>
                  <span className="recipe-page__column-subtitle">цвет + Silver Series</span>
                </div>
                {hasSilversInPalette && recipeResultSilver && !silverImproves ? (
                  <div className="recipe-page__column-empty">
                    <span className="recipe-page__column-no-silver-icon">—</span>
                    <p>Не улучшают результат для этого оттенка</p>
                    <p className="recipe-page__column-note">
                      Рецепт из палитры даёт{' '}
                      <strong>{distanceLabel(recipeResultMain?.distance ?? 0).text}</strong>
                      {' '}— с сильверами было бы{' '}
                      <strong>{distanceLabel(recipeResultSilver.distance ?? 0).text}</strong>
                      {' '}или хуже
                    </p>
                  </div>
                ) : hasSilversInPalette && recipeResultSilver ? (
                  <>
                    {recipeResultSilver.recipe.ingredients.length > 1 && (
                      <details className="recipe-page__recipe-info">
                        <summary className="recipe-page__recipe-info-toggle">ℹ️ О порядке и пропорциях</summary>
                        <div className="recipe-page__recipe-info-body">
                          <p><strong>Важно:</strong> добавляйте цвета в указанном порядке, тщательно перемешивая каждый новый цвет.</p>
                          <p><strong>Про части и капли:</strong> 1 часть ≈ 1 капля одинакового объёма.</p>
                        </div>
                      </details>
                    )}
                    <RecipeDisplay
                      recipe={recipeResultSilver.recipe}
                      getColorById={getColorById}
                      format="parts"
                      showIngredients
                      onExcludeIngredient={handleExcludeIngredient}
                    />
                    <div className="recipe-page__column-footer">
                      <div className="recipe-page__column-result">
                        <span className="recipe-page__result-chip" style={{ backgroundColor: recipeResultSilver.recipe.resultColor.hex }} />
                        <span className={`recipe-page__result-label recipe-page__result-label--${distanceLabel(recipeResultSilver.distance ?? 0).level}`}>
                          {distanceLabel(recipeResultSilver.distance ?? 0).text}
                        </span>
                      </div>
                      {recipeResultSilver.warnings.filter((w) => w.type !== 'unreachable').map((w, i) => (
                        <WarningBadge key={`silver-${w.type}-${i}`} warning={w} showIcon />
                      ))}
                      <Button variant="primary" size="sm" onClick={() => { setRecipeToSave(recipeResultSilver); setIsSaveModalOpen(true) }}>
                        Сохранить рецепт
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="recipe-page__column-empty">
                    <p>Нет сильверов в палитре</p>
                    <Button variant="outline" size="sm" onClick={() => navigate('/palette')}>
                      Добавить в палитру
                    </Button>
                  </div>
                )}
              </div>

              {/* Колонка 3: Добавить краску */}
              {paletteAdditionSuggestion ? (
                <div className="recipe-page__column recipe-page__column--suggestion">
                  <div className="recipe-page__column-header">
                    <h3 className="recipe-page__column-title">Добавить краску</h3>
                    <span className="recipe-page__column-subtitle">улучшит результат</span>
                  </div>
                  <div className="recipe-page__suggestion-color">
                    <span
                      className="recipe-page__suggestion-swatch"
                      style={{ backgroundColor: paletteAdditionSuggestion.color.hex }}
                    />
                    <div className="recipe-page__suggestion-color-info">
                      <strong>{paletteAdditionSuggestion.color.name}</strong>
                      <code className="recipe-page__suggestion-color-hex">{paletteAdditionSuggestion.color.hex}</code>
                    </div>
                  </div>
                  <RecipeDisplay
                    recipe={paletteAdditionSuggestion.recipe.recipe}
                    getColorById={getColorByIdExtended}
                    format="parts"
                    showIngredients
                  />
                  <div className="recipe-page__column-footer">
                    <div className="recipe-page__column-result">
                      <span className="recipe-page__result-chip" style={{ backgroundColor: paletteAdditionSuggestion.recipe.recipe.resultColor.hex }} />
                      <span className="recipe-page__result-label recipe-page__result-label--close">
                        {distanceLabel(paletteAdditionSuggestion.distanceBefore).text} → <strong>{distanceLabel(paletteAdditionSuggestion.distanceAfter).text}</strong>
                      </span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/palette')}>
                      Добавить в палитру
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="recipe-page__column recipe-page__column--suggestion recipe-page__column--empty-slot" />
              )}
            </div>

            {/* Недостижимость */}
            {(recipeResultMain?.warnings.some((w) => w.type === 'unreachable') ||
              recipeResultSilver?.warnings.some((w) => w.type === 'unreachable')) && (
              <div className="recipe-page__unreachable-row">
                <span className="recipe-page__unreachable-badge">
                  ⚠️ Точное совпадение недостижимо из вашей палитры — попробуйте добавить недостающий оттенок
                </span>
              </div>
            )}

            <details className="recipe-page__mixing-tips">
              <summary className="recipe-page__mixing-tips-toggle">⚠️ Важно про смешивание красок</summary>
              <ul className="recipe-page__mixing-tips-list">
                <li>
                  <strong>Аллергия:</strong> при смешивании разных пигментов растёт количество компонентов и риск
                  аллергических реакций. Используйте только проверенные бренды и не экспериментируйте на клиентах
                  без тестов.
                </li>
                <li>
                  <strong>Повторяемость оттенка:</strong> даже при точной схеме сложно добиться идеального
                  повторения — учитывайте объём, способ набора капель и особенности конкретных партий красок.
                </li>
                <li>
                  <strong>Удаление тату:</strong> сложные миксы, особенно с тёмными/холодными компонентами,
                  сложнее выводятся лазером и могут уходить неравномерно.
                </li>
                <li>
                  <strong>Про бренды:</strong> формулы математические и не знают точную химию World Famous,
                  Limitless и других марок. Используйте расчёт как ориентир, финальный оттенок уточняйте на
                  палитре и латексе.
                </li>
              </ul>
            </details>
          </div>
        )}
      </div>

      {recipeToSave && (
        <SaveRecipeModal
          isOpen={isSaveModalOpen}
          onClose={() => { setIsSaveModalOpen(false); setRecipeToSave(null) }}
          onSave={handleSaveRecipe}
          recipe={recipeToSave.recipe}
        />
      )}

    </Container>
  )
}

export default RecipePage
