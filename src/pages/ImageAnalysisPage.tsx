import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ImageUploader from '@/components/ImageUploader/ImageUploader'
import Button from '@/components/Button/Button'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import Container from '@/components/Container/Container'
import ColorDetailsModal from '@/components/ColorDetailsModal/ColorDetailsModal'
import ImageHighlighter from '@/components/ImageHighlighter/ImageHighlighter'
import { processImageFile, createImagePreview, createColorPixelMapping } from '@/utils/imageProcessor'
import { usePaletteContext } from '@/contexts/PaletteContext'
import { useColorContext } from '@/contexts/ColorContext'
import { createColorFromHex, getColorNameFromHue } from '@/utils/colorOperations'
import { rgbToCmyk } from '@/utils/colorConversions'
import type { SelectionMethod } from '@/types'
import ColorAnalysisWorker from '@/workers/colorAnalysis.worker?worker'
import './ImageAnalysisPage.css'

const COLOR_COUNT_OPTIONS = [8, 16, 24, 36, 72, 120] as const

function ImageAnalysisPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [colorCount, setColorCount] = useState<number>(16)
  const [selectionMethod, setSelectionMethod] = useState<SelectionMethod>('representative')
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(20)
  const [achromaticThreshold, setAchromaticThreshold] = useState<number>(10)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [selectedColorHex, setSelectedColorHex] = useState<string | null>(null)
  const [isColorDetailsModalOpen, setIsColorDetailsModalOpen] = useState(false)
  const [originalResults, setOriginalResults] = useState<string[]>([])
  const [highlightedPixels, setHighlightedPixels] = useState<Array<{ x: number; y: number }>>([])
  const [highlightedHex, setHighlightedHex] = useState<string | null>(null)
  const [expandedColorHexes, setExpandedColorHexes] = useState<Set<string>>(new Set())
  const imageCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const { addColor } = usePaletteContext()
  const { setTargetColorFromHex } = useColorContext()
  const navigate = useNavigate()
  const workerRef = useRef<Worker | null>(null)

  // Инициализация и очистка Web Worker
  useEffect(() => {
    workerRef.current = new ColorAnalysisWorker()

    workerRef.current.onmessage = (e) => {
      const { type, colors, error: workerError } = e.data

      if (type === 'analyze-result') {
        setIsProcessing(false)
        if (workerError) {
          setError(workerError)
          setResults([])
          setOriginalResults([])
        } else {
          setResults(colors)
          setOriginalResults(colors)
          setError(null)
        }
        setHasAnalyzed(true)
      }
    }

    workerRef.current.onerror = (err) => {
      setIsProcessing(false)
      setError('Ошибка при обработке изображения в Web Worker')
      console.error('Worker error:', err)
      setHasAnalyzed(true)
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])

  const handleImageSelect = async (file: File) => {
    setSelectedFile(file)
    setError(null)
    setResults([])
    setHasAnalyzed(false)

    try {
      const preview = await createImagePreview(file)
      setImagePreview(preview)
    } catch (err) {
      setError('Не удалось загрузить изображение')
      console.error(err)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile || !workerRef.current) return

    setIsProcessing(true)
    setError(null)
    setResults([])
    setHasAnalyzed(false)

    try {
      // Обработка изображения (в основном потоке, так как это быстро)
      const { pixels, canvas } = await processImageFile(selectedFile)
      imageCanvasRef.current = canvas

      // Отправляем данные в Web Worker для обработки
      workerRef.current.postMessage({
        type: 'analyze',
        pixels,
        colorCount,
        selectionMethod,
        similarityThreshold,
        achromaticThreshold,
      })
    } catch (err) {
      setIsProcessing(false)
      const errorMessage =
        err instanceof Error ? err.message : 'Произошла ошибка при анализе'
      setError(errorMessage)
      console.error(err)
      setHasAnalyzed(true)
    }
  }

  const handleClear = () => {
    setSelectedFile(null)
    setImagePreview(null)
    setResults([])
    setError(null)
    setHasAnalyzed(false)
    setHighlightedPixels([])
    imageCanvasRef.current = null
  }

  const resultsRef = useRef<HTMLDivElement>(null)

  const handleAddToPalette = (hex: string) => {
    try {
      const color = createColorFromHex(hex)
      addColor(color)
    } catch (e) {
      console.error('Не удалось добавить цвет в палитру', e)
      setError('Не удалось добавить цвет в палитру')
    }
  }

  const handleFindRecipe = (hex: string) => {
    try {
      setTargetColorFromHex(hex)
      navigate('/recipe')
    } catch (e) {
      console.error('Не удалось установить целевой цвет', e)
      setError('Не удалось установить целевой цвет')
    }
  }

  const handleCopyHex = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex)
    } catch (e) {
      console.error('Не удалось скопировать HEX', e)
      setError('Не удалось скопировать HEX')
    }
  }

  const handleColorClick = (hex: string) => {
    setSelectedColorHex(hex)
    setIsColorDetailsModalOpen(true)
  }

  const handleCloseColorDetails = () => {
    setIsColorDetailsModalOpen(false)
    setSelectedColorHex(null)
  }

  const handleToggleColorInfo = (hex: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedColorHexes((prev) => {
      const next = new Set(prev)
      if (next.has(hex)) {
        next.delete(hex)
      } else {
        next.add(hex)
      }
      return next
    })
  }

  const handleRemoveColor = (hexToRemove: string) => {
    setResults((prevResults) => prevResults.filter((hex) => hex !== hexToRemove))
  }

  const handleRestoreAll = () => {
    setResults([...originalResults])
  }

  const handleColorHover = (hex: string) => {
    if (imageCanvasRef.current) {
      try {
        const pixels = createColorPixelMapping(imageCanvasRef.current, hex, 40)
        setHighlightedPixels(pixels)
        setHighlightedHex(hex)
      } catch (error) {
        console.error('Failed to create pixel mapping:', error)
        setHighlightedPixels([])
        setHighlightedHex(null)
      }
    }
  }

  const handleColorLeave = () => {
    setHighlightedPixels([])
    setHighlightedHex(null)
  }

  // Тач-эквивалент hover: на телефоне нет "наведения", поэтому тап по свотчу
  // переключает подсветку на фото (тап ещё раз — снимает подсветку)
  const handleColorTap = (hex: string) => {
    if (highlightedHex === hex) {
      handleColorLeave()
    } else {
      handleColorHover(hex)
    }
  }

  return (
    <Container>
      <div className="image-analysis-page">
        <h1 className="image-analysis-page__title">Анализ изображения</h1>
        <p className="image-analysis-page__subtitle">
          Загрузите изображение для автоматического выделения доминирующих цветов
          и добавления понравившихся оттенков в вашу палитру
        </p>

        {!selectedFile && (
          <div className="image-analysis-page__upload-section">
            <ImageUploader onImageSelect={handleImageSelect} />
          </div>
        )}

        {selectedFile && (
          <div className="image-analysis-page__layout">
            <div className="image-analysis-page__preview-section">
              <div className="image-analysis-page__image-wrapper">
                {imagePreview && (
                  <ImageHighlighter
                    imageSrc={imagePreview}
                    highlightedPixels={highlightedPixels}
                    highlightColor="rgba(255, 255, 0, 0.6)"
                    opacity={0.6}
                    sourceWidth={imageCanvasRef.current?.width}
                    sourceHeight={imageCanvasRef.current?.height}
                  />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="image-analysis-page__clear-btn"
                >
                  ✕ Удалить
                </Button>
              </div>

              {highlightedHex && (
                <div className="image-analysis-page__selected-color">
                  <span
                    className="image-analysis-page__selected-color-swatch"
                    style={{ backgroundColor: highlightedHex }}
                    aria-hidden="true"
                  />
                  <code className="image-analysis-page__selected-color-hex">{highlightedHex}</code>
                  <button
                    className="image-analysis-page__selected-color-action"
                    onClick={() => handleCopyHex(highlightedHex)}
                    title="Скопировать HEX"
                    aria-label="Скопировать HEX"
                  >
                    📋
                  </button>
                  <button
                    className="image-analysis-page__selected-color-action"
                    onClick={() => handleAddToPalette(highlightedHex)}
                    title="Добавить в палитру"
                    aria-label="Добавить в палитру"
                  >
                    ➕
                  </button>
                  <button
                    className="image-analysis-page__selected-color-action"
                    onClick={() => handleFindRecipe(highlightedHex)}
                    title="Подобрать рецепт смешивания"
                    aria-label="Подобрать рецепт смешивания"
                  >
                    🧪
                  </button>
                </div>
              )}
            </div>

            <div className="image-analysis-page__content-section">
              <div className="image-analysis-page__controls">
                <div className="image-analysis-page__control-group">
                  <label
                    htmlFor="color-count"
                    className="image-analysis-page__label"
                    title="Количество цветов для извлечения из изображения. Больше цветов = дольше обработка, но более детальный анализ."
                  >
                    Количество цветов: {colorCount}
                  </label>
                  <div className="image-analysis-page__slider-with-input">
                    <input
                      type="range"
                      id="color-count"
                      min="8"
                      max="120"
                      step="8"
                      value={colorCount}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        // Округляем до ближайшего значения из опций
                        const nearest = COLOR_COUNT_OPTIONS.reduce((prev, curr) =>
                          Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
                        )
                        setColorCount(nearest)
                      }}
                      className="image-analysis-page__slider"
                      disabled={isProcessing}
                      list="color-count-options"
                    />
                    <datalist id="color-count-options">
                      {COLOR_COUNT_OPTIONS.map((count) => (
                        <option key={count} value={count} label={count.toString()} />
                      ))}
                    </datalist>
                    <input
                      type="number"
                      min="8"
                      max="120"
                      value={colorCount}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        if (value >= 8 && value <= 120) {
                          setColorCount(value)
                        }
                      }}
                      className="image-analysis-page__number-input"
                      disabled={isProcessing}
                    />
                  </div>
                  <div className="image-analysis-page__slider-hint">
                    Больше цветов = дольше обработка, но более детальный анализ
                  </div>
                </div>

                <details className="image-analysis-page__advanced">
                  <summary className="image-analysis-page__advanced-summary">
                    ⚙️ Дополнительные настройки
                  </summary>
                  <div className="image-analysis-page__advanced-content">
                    <div className="image-analysis-page__control-group">
                      <label
                        htmlFor="selection-method"
                        className="image-analysis-page__label"
                      >
                        Метод анализа:
                      </label>
                      <select
                        id="selection-method"
                        value={selectionMethod}
                        onChange={(e) => setSelectionMethod(e.target.value as SelectionMethod)}
                        className="image-analysis-page__select"
                        disabled={isProcessing}
                      >
                        <option value="representative">
                          Репрезентативные (художественный)
                        </option>
                        <option value="dominant">
                          Доминирующие (по площади)
                        </option>
                      </select>
                    </div>

                    <div className="image-analysis-page__control-group">
                      <label
                        htmlFor="similarity-threshold"
                        className="image-analysis-page__label"
                        title="Порог схожести (Delta E): чем меньше значение, тем более похожие цвета группируются вместе. Меньшие значения дают больше цветов, большие - меньше."
                      >
                        Порог схожести: {similarityThreshold}
                      </label>
                      <input
                        type="range"
                        id="similarity-threshold"
                        min="5"
                        max="50"
                        value={similarityThreshold}
                        onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                        className="image-analysis-page__slider"
                        disabled={isProcessing}
                      />
                      <div className="image-analysis-page__slider-hint">
                        Меньше значение = больше цветов (более строгая группировка)
                      </div>
                    </div>

                    <div className="image-analysis-page__control-group">
                      <label
                        htmlFor="achromatic-threshold"
                        className="image-analysis-page__label"
                        title="Порог 'серого': цвета с насыщенностью ниже этого значения считаются серыми (ахроматическими) и сортируются отдельно от цветных."
                      >
                        Порог "серого": {achromaticThreshold}
                      </label>
                      <input
                        type="range"
                        id="achromatic-threshold"
                        min="0"
                        max="50"
                        value={achromaticThreshold}
                        onChange={(e) => setAchromaticThreshold(Number(e.target.value))}
                        className="image-analysis-page__slider"
                        disabled={isProcessing}
                      />
                      <div className="image-analysis-page__slider-hint">
                        Меньше значение = больше цветов считаются серыми
                      </div>
                    </div>
                  </div>
                </details>

                <Button
                  onClick={handleAnalyze}
                  disabled={isProcessing}
                  className="image-analysis-page__analyze-btn"
                >
                  {isProcessing ? 'Обработка...' : 'Анализировать'}
                </Button>
              </div>

              {error && (
                <div className="image-analysis-page__error" role="alert">
                  {error}
                </div>
              )}

              {isProcessing && (
                <div className="image-analysis-page__loading">
                  <LoadingSpinner
                    text="Анализ изображения, это может занять несколько секунд..."
                    size="large"
                  />
                </div>
              )}

              {hasAnalyzed && !isProcessing && results.length === 0 && !error && (
                <div className="image-analysis-page__empty">
                  После исключения белого и черного подходящих цветов не найдено
                </div>
              )}

              {results.length > 0 && (
                <div className="image-analysis-page__results" ref={resultsRef}>
                  <div className="image-analysis-page__results-header">
                    <h2 className="image-analysis-page__results-title">
                      Результаты анализа ({results.length} цветов)
                    </h2>
                    {results.length < originalResults.length && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRestoreAll}
                        title="Восстановить все удаленные цвета"
                      >
                        ↶ Восстановить все
                      </Button>
                    )}
                  </div>
                  <div className="image-analysis-page__results-grid">
                    {results.map((hex, index) => {
                      const isExpanded = expandedColorHexes.has(hex)
                      let colorInfo = null
                      try {
                        const color = createColorFromHex(hex)
                        colorInfo = color
                      } catch (e) {
                        console.error('Failed to parse color:', hex, e)
                      }

                      return (
                        <div
                          key={`${hex}-${index}`}
                          className={`image-analysis-page__result-card ${
                            highlightedHex === hex ? 'image-analysis-page__result-card--selected' : ''
                          }`}
                          onMouseEnter={() => handleColorHover(hex)}
                          onMouseLeave={handleColorLeave}
                          onClick={() => handleColorClick(hex)}
                        >
                          <div className="image-analysis-page__color-preview-wrapper">
                            <div
                              className="image-analysis-page__color-preview"
                              style={{ backgroundColor: hex, cursor: 'pointer' }}
                              title={`${hex} - нажмите, чтобы показать на фото`}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleColorTap(hex)
                              }}
                            />
                            <button
                              className="image-analysis-page__remove-color-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveColor(hex)
                              }}
                              title="Удалить цвет из результатов"
                              aria-label="Удалить цвет"
                            >
                              ×
                            </button>
                          </div>
                          <div className="image-analysis-page__result-content">
                            <div className="image-analysis-page__ink-hex">
                              {hex}
                            </div>
                            {isExpanded && colorInfo && (
                              <div className="image-analysis-page__color-details">
                                <div className="image-analysis-page__color-detail-item">
                                  <span className="image-analysis-page__color-detail-label">RGB:</span>
                                  <code className="image-analysis-page__color-detail-value">
                                    rgb({colorInfo.rgb.r}, {colorInfo.rgb.g}, {colorInfo.rgb.b})
                                  </code>
                                </div>
                                <div className="image-analysis-page__color-detail-item">
                                  <span className="image-analysis-page__color-detail-label">HSL:</span>
                                  <code className="image-analysis-page__color-detail-value">
                                    hsl({colorInfo.hsl.h}, {colorInfo.hsl.s}%, {colorInfo.hsl.l}%)
                                  </code>
                                </div>
                                {(() => {
                                  const cmyk = rgbToCmyk(colorInfo.rgb)
                                  return (
                                    <div className="image-analysis-page__color-detail-item">
                                      <span className="image-analysis-page__color-detail-label">CMYK:</span>
                                      <code className="image-analysis-page__color-detail-value">
                                        cmyk({cmyk.c.toFixed(1)}%, {cmyk.m.toFixed(1)}%, {cmyk.y.toFixed(1)}%, {cmyk.k.toFixed(1)}%)
                                      </code>
                                    </div>
                                  )
                                })()}
                                <div className="image-analysis-page__color-detail-item">
                                  <span className="image-analysis-page__color-detail-label">Название:</span>
                                  <span className="image-analysis-page__color-detail-value">
                                    {getColorNameFromHue(colorInfo.hsl.h)}
                                  </span>
                                </div>
                              </div>
                            )}
                            <div className="image-analysis-page__result-actions">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleFindRecipe(hex)
                                }}
                                title="Подобрать рецепт смешивания для этого цвета"
                              >
                                <span aria-hidden="true">🧪</span>
                                <span className="image-analysis-page__action-label">Подобрать рецепт</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAddToPalette(hex)
                                }}
                                title="Добавить этот цвет в палитру"
                              >
                                <span aria-hidden="true">➕</span>
                                <span className="image-analysis-page__action-label">В палитру</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => handleToggleColorInfo(hex, e)}
                                title={isExpanded ? "Скрыть информацию о цвете" : "Показать информацию о цвете"}
                              >
                                <span aria-hidden="true">{isExpanded ? '🔽' : 'ℹ️'}</span>
                                <span className="image-analysis-page__action-label">
                                  {isExpanded ? 'Скрыть инфо' : 'Инфо о цвете'}
                                </span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCopyHex(hex)
                                }}
                                title="Скопировать HEX"
                              >
                                <span aria-hidden="true">📋</span>
                                <span className="image-analysis-page__action-label">Копировать HEX</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedColorHex && (
          <ColorDetailsModal
            isOpen={isColorDetailsModalOpen}
            colorHex={selectedColorHex}
            onClose={handleCloseColorDetails}
            onAddToPalette={handleAddToPalette}
            onFindRecipe={handleFindRecipe}
          />
        )}
      </div>
    </Container>
  )
}

export default ImageAnalysisPage

