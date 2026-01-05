import { useState, useEffect, useRef } from 'react'
import type { AnalysisResult } from '@/types'
import ImageUploader from '@/components/ImageUploader/ImageUploader'
import Button from '@/components/Button/Button'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import Container from '@/components/Container/Container'
import { processImageFile, createImagePreview } from '@/utils/imageProcessor'
import { quantizeColors } from '@/utils/quantizer'
import { BrandInkService } from '@/services/brandInks'
import './ImageAnalysisPage.css'

const COLOR_COUNT_OPTIONS = [8, 16, 24, 36, 72, 120] as const
const HIGH_DISTANCE_THRESHOLD = 50 // Порог для предупреждения о большом отличии

function ImageAnalysisPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [colorCount, setColorCount] = useState<number>(16)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedResultIndex, setSelectedResultIndex] = useState<number | null>(null)

  const handleImageSelect = async (file: File) => {
    setSelectedFile(file)
    setError(null)
    setResults([])

    try {
      const preview = await createImagePreview(file)
      setImagePreview(preview)
    } catch (err) {
      setError('Не удалось загрузить изображение')
      console.error(err)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setError(null)
    setResults([])

    try {
      // Обработка изображения
      const { pixels } = await processImageFile(selectedFile)

      // Квантование цветов
      const quantizedColors = quantizeColors(pixels, colorCount)

      // Сопоставление с каталогом красок
      const analysisResults: AnalysisResult[] = quantizedColors.map((hex) =>
        BrandInkService.matchColorToInk(hex)
      )

      setResults(analysisResults)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Произошла ошибка при анализе'
      setError(errorMessage)
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClear = () => {
    setSelectedFile(null)
    setImagePreview(null)
    setResults([])
    setError(null)
  }

  const getDistanceSeverity = (distance: number): 'low' | 'medium' | 'high' => {
    if (distance < HIGH_DISTANCE_THRESHOLD / 2) return 'low'
    if (distance < HIGH_DISTANCE_THRESHOLD) return 'medium'
    return 'high'
  }

  const resultsRef = useRef<HTMLDivElement>(null)

  // Закрытие деталей при клике вне карточек
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node)
      ) {
        setSelectedResultIndex(null)
      }
    }

    if (selectedResultIndex !== null) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [selectedResultIndex])

  return (
    <Container>
      <div className="image-analysis-page">
        <h1 className="image-analysis-page__title">Анализ изображения</h1>
        <p className="image-analysis-page__subtitle">
          Загрузите изображение для автоматического выделения доминирующих цветов
          и подбора красок из каталога производителей
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
                >
                  Количество цветов:
                </label>
                <select
                  id="color-count"
                  value={colorCount}
                  onChange={(e) => setColorCount(Number(e.target.value))}
                  className="image-analysis-page__select"
                  disabled={isProcessing}
                >
                  {COLOR_COUNT_OPTIONS.map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
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

            {results.length > 0 && (
              <div className="image-analysis-page__results" ref={resultsRef}>
                <h2 className="image-analysis-page__results-title">
                  Результаты анализа ({results.length} цветов)
                </h2>
                <div className="image-analysis-page__results-grid">
                  {results.map((result, index) => {
                    const severity = getDistanceSeverity(result.distance)
                    const hasWarning = result.distance >= HIGH_DISTANCE_THRESHOLD
                    const isSelected = selectedResultIndex === index

                    return (
                      <div
                        key={index}
                        className={`image-analysis-page__result-card ${isSelected ? 'image-analysis-page__result-card--selected' : ''}`}
                        onClick={() => setSelectedResultIndex(isSelected ? null : index)}
                      >
                        <div className="image-analysis-page__color-preview-wrapper">
                          <div
                            className="image-analysis-page__color-preview"
                            style={{ backgroundColor: result.originalColor }}
                            title={result.originalColor}
                          />
                          {hasWarning && (
                            <div
                              className={`image-analysis-page__warning-icon image-analysis-page__warning-icon--${severity}`}
                              title={`Большое отличие: ${Math.round(result.distance)} единиц`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedResultIndex(isSelected ? null : index)
                              }}
                            >
                              ⚠️
                            </div>
                          )}
                        </div>
                        <div className="image-analysis-page__result-content">
                          <div className="image-analysis-page__ink-name">
                            {result.matchedInk.name}
                          </div>
                          <div className="image-analysis-page__ink-brand">
                            {result.matchedInk.brand}
                          </div>
                          <div className="image-analysis-page__ink-hex">
                            {result.matchedInk.hex}
                          </div>
                          {isSelected && hasWarning && (
                            <div className="image-analysis-page__warning-details">
                              <div className="image-analysis-page__warning-title">
                                ⚠️ Большое отличие
                              </div>
                              <div className="image-analysis-page__warning-text">
                                Расстояние до найденного цвета: {Math.round(result.distance)} единиц
                              </div>
                              <div className="image-analysis-page__warning-hint">
                                Цвет из каталога может отличаться от исходного
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Container>
  )
}

export default ImageAnalysisPage

