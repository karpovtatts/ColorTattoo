import { useState, useRef, useEffect } from 'react'
import ImageUploader from '@/components/ImageUploader/ImageUploader'
import Button from '@/components/Button/Button'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import Container from '@/components/Container/Container'
import ColorDetailsModal from '@/components/ColorDetailsModal/ColorDetailsModal'
import { processImageFile, createImagePreview } from '@/utils/imageProcessor'
import { usePaletteContext } from '@/contexts/PaletteContext'
import { createColorFromHex } from '@/utils/colorOperations'
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
  const { addColor } = usePaletteContext()
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
      const { pixels } = await processImageFile(selectedFile)

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

  const handleRemoveColor = (hexToRemove: string) => {
    setResults((prevResults) => prevResults.filter((hex) => hex !== hexToRemove))
  }

  const handleRestoreAll = () => {
    setResults([...originalResults])
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
          <>
            <div className="image-analysis-page__preview-section">
              <div className="image-analysis-page__image-wrapper">
                <img
                  src={imagePreview || ''}
                  alt="Загруженное изображение"
                  className="image-analysis-page__image"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="image-analysis-page__clear-btn"
                >
                  ✕ Удалить
                </Button>
              </div>
            </div>

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
                  {results.map((hex, index) => (
                    <div
                      key={`${hex}-${index}`}
                      className="image-analysis-page__result-card"
                    >
                      <div className="image-analysis-page__color-preview-wrapper">
                        <div
                          className="image-analysis-page__color-preview"
                          style={{ backgroundColor: hex }}
                          title={`${hex} - Кликните для деталей`}
                          onClick={() => handleColorClick(hex)}
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
                        <div
                          className="image-analysis-page__ink-hex"
                          onClick={() => handleColorClick(hex)}
                          style={{ cursor: 'pointer' }}
                          title="Кликните для деталей"
                        >
                          {hex}
                        </div>
                        <div className="image-analysis-page__result-actions" style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <Button
                            size="sm"
                            onClick={() => handleAddToPalette(hex)}
                            title="Добавить этот цвет в палитру"
                          >
                            ➕ В палитру
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyHex(hex)}
                            title="Скопировать HEX"
                          >
                            📋 Копировать HEX
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {selectedColorHex && (
          <ColorDetailsModal
            isOpen={isColorDetailsModalOpen}
            colorHex={selectedColorHex}
            onClose={handleCloseColorDetails}
            onAddToPalette={handleAddToPalette}
          />
        )}
      </div>
    </Container>
  )
}

export default ImageAnalysisPage

