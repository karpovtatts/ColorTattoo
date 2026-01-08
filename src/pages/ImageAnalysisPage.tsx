import { useState, useRef } from 'react'
import ImageUploader from '@/components/ImageUploader/ImageUploader'
import Button from '@/components/Button/Button'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import Container from '@/components/Container/Container'
import { processImageFile, createImagePreview } from '@/utils/imageProcessor'
import { quantizeColors } from '@/utils/quantizer'
import { usePaletteContext } from '@/contexts/PaletteContext'
import { createColorFromHex } from '@/utils/colorOperations'
import './ImageAnalysisPage.css'

const COLOR_COUNT_OPTIONS = [8, 16, 24, 36, 72, 120] as const

function ImageAnalysisPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [colorCount, setColorCount] = useState<number>(16)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const { addColor } = usePaletteContext()

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
      setResults(quantizedColors)
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

  const resultsRef = useRef<HTMLDivElement>(null)

  const handleAddToPalette = (hex: string) => {
    try {
      const color = createColorFromHex(hex, undefined, hex.toUpperCase())
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
                  {results.map((hex, index) => (
                    <div
                      key={`${hex}-${index}`}
                      className="image-analysis-page__result-card"
                    >
                      <div className="image-analysis-page__color-preview-wrapper">
                        <div
                          className="image-analysis-page__color-preview"
                          style={{ backgroundColor: hex }}
                          title={hex}
                        />
                      </div>
                      <div className="image-analysis-page__result-content">
                        <div className="image-analysis-page__ink-hex">{hex}</div>
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
      </div>
    </Container>
  )
}

export default ImageAnalysisPage

