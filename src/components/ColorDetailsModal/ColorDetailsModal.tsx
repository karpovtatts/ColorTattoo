import { useEffect, useState } from 'react'
import type { Color } from '@/types'
import {
  createColorFromHex,
  getColorNameFromHue,
  getComplementaryColorForHarmony,
  getTriadicColors,
  getAnalogousColors,
} from '@/utils/colorOperations'
import { rgbToCmyk } from '@/utils/colorConversions'
import ColorPreview from '@/components/ColorPreview/ColorPreview'
import Button from '@/components/Button/Button'
import './ColorDetailsModal.css'

interface ColorDetailsModalProps {
  isOpen: boolean
  colorHex: string
  onClose: () => void
  onAddToPalette?: (hex: string) => void
  onFindRecipe?: (hex: string) => void
}

function ColorDetailsModal({
  isOpen,
  colorHex,
  onClose,
  onAddToPalette,
  onFindRecipe,
}: ColorDetailsModalProps) {
  const [color, setColor] = useState<Color | null>(null)
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && colorHex) {
      try {
        const newColor = createColorFromHex(colorHex)
        setColor(newColor)
      } catch (error) {
        console.error('Failed to create color from hex:', error)
        setColor(null)
      }
    }
  }, [isOpen, colorHex])

  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'

      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = ''
      }
    }
  }, [isOpen, onClose])

  if (!isOpen || !color) {
    return null
  }

  const colorName = getColorNameFromHue(color.hsl.h)
  const cmyk = rgbToCmyk(color.rgb)

  const handleCopy = async (text: string, format: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedFormat(format)
      setTimeout(() => {
        setCopiedFormat(null)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const formatRgb = () => {
    return `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`
  }

  const formatHsl = () => {
    return `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`
  }

  const formatCmyk = () => {
    return `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`
  }

  return (
    <div className="color-details-modal-overlay" onClick={handleBackdropClick}>
      <div
        className="color-details-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="color-details-modal__header">
          <h2>Информация о цвете</h2>
          <button
            className="color-details-modal__close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <div className="color-details-modal__content">
          <div className="color-details-modal__preview">
            <ColorPreview color={color} size="large" />
          </div>

          <div className="color-details-modal__info">
            <div className="color-details-modal__name">
              <span className="color-details-modal__label">Название:</span>
              <span className="color-details-modal__value">{colorName}</span>
            </div>

            <div className="color-details-modal__format-group">
              <div className="color-details-modal__format-item">
                <span className="color-details-modal__format-label">HEX</span>
                <div className="color-details-modal__format-value-group">
                  <code className="color-details-modal__format-value">{color.hex}</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(color.hex, 'hex')}
                    title="Копировать HEX"
                  >
                    {copiedFormat === 'hex' ? '✓' : '📋'}
                  </Button>
                </div>
              </div>

              <div className="color-details-modal__format-item">
                <span className="color-details-modal__format-label">RGB</span>
                <div className="color-details-modal__format-value-group">
                  <code className="color-details-modal__format-value">
                    {formatRgb()}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(formatRgb(), 'rgb')}
                    title="Копировать RGB"
                  >
                    {copiedFormat === 'rgb' ? '✓' : '📋'}
                  </Button>
                </div>
              </div>

              <div className="color-details-modal__format-item">
                <span className="color-details-modal__format-label">RGB значения</span>
                <div className="color-details-modal__format-value-group">
                  <code className="color-details-modal__format-value">
                    {color.rgb.r}, {color.rgb.g}, {color.rgb.b}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(`${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}`, 'rgb-values')}
                    title="Копировать RGB значения"
                  >
                    {copiedFormat === 'rgb-values' ? '✓' : '📋'}
                  </Button>
                </div>
              </div>

              <div className="color-details-modal__format-item">
                <span className="color-details-modal__format-label">HSL</span>
                <div className="color-details-modal__format-value-group">
                  <code className="color-details-modal__format-value">
                    {formatHsl()}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(formatHsl(), 'hsl')}
                    title="Копировать HSL"
                  >
                    {copiedFormat === 'hsl' ? '✓' : '📋'}
                  </Button>
                </div>
              </div>

              <div className="color-details-modal__format-item">
                <span className="color-details-modal__format-label">HSL значения</span>
                <div className="color-details-modal__format-value-group">
                  <code className="color-details-modal__format-value">
                    H: {color.hsl.h}°, S: {color.hsl.s}%, L: {color.hsl.l}%
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(`${color.hsl.h}, ${color.hsl.s}, ${color.hsl.l}`, 'hsl-values')}
                    title="Копировать HSL значения"
                  >
                    {copiedFormat === 'hsl-values' ? '✓' : '📋'}
                  </Button>
                </div>
              </div>

              <div className="color-details-modal__format-item">
                <span className="color-details-modal__format-label">CMYK</span>
                <div className="color-details-modal__format-value-group">
                  <code className="color-details-modal__format-value">
                    {formatCmyk()}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(formatCmyk(), 'cmyk')}
                    title="Копировать CMYK"
                  >
                    {copiedFormat === 'cmyk' ? '✓' : '📋'}
                  </Button>
                </div>
              </div>

              <div className="color-details-modal__format-item">
                <span className="color-details-modal__format-label">CMYK значения</span>
                <div className="color-details-modal__format-value-group">
                  <code className="color-details-modal__format-value">
                    C: {cmyk.c}%, M: {cmyk.m}%, Y: {cmyk.y}%, K: {cmyk.k}%
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(`${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k}`, 'cmyk-values')}
                    title="Копировать CMYK значения"
                  >
                    {copiedFormat === 'cmyk-values' ? '✓' : '📋'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="color-details-modal__harmony">
              <h3 className="color-details-modal__harmony-title">Гармония цветов</h3>
              
              <div className="color-details-modal__harmony-section">
                <div className="color-details-modal__harmony-header">
                  <h4 className="color-details-modal__harmony-subtitle">Комплементарный</h4>
                  <p className="color-details-modal__harmony-description">
                    Противоположный цвет на цветовом круге. Создает контраст и динамику.
                  </p>
                </div>
                <div className="color-details-modal__harmony-colors">
                  {(() => {
                    const complementary = getComplementaryColorForHarmony(color)
                    return (
                      <div
                        key={complementary.hex}
                        className="color-details-modal__harmony-color-item"
                        onClick={() => onAddToPalette?.(complementary.hex)}
                        title="Кликните для добавления в палитру"
                      >
                        <div
                          className="color-details-modal__harmony-color-preview"
                          style={{ backgroundColor: complementary.hex }}
                        />
                        <div className="color-details-modal__harmony-color-hex">{complementary.hex}</div>
                      </div>
                    )
                  })()}
                </div>
              </div>

              <div className="color-details-modal__harmony-section">
                <div className="color-details-modal__harmony-header">
                  <h4 className="color-details-modal__harmony-subtitle">Триада</h4>
                  <p className="color-details-modal__harmony-description">
                    Три равномерно распределенных цвета на цветовом круге (120°). Создает яркую, сбалансированную палитру.
                  </p>
                </div>
                <div className="color-details-modal__harmony-colors">
                  {getTriadicColors(color).map((triadicColor) => (
                    <div
                      key={triadicColor.hex}
                      className="color-details-modal__harmony-color-item"
                      onClick={() => onAddToPalette?.(triadicColor.hex)}
                      title="Кликните для добавления в палитру"
                    >
                      <div
                        className="color-details-modal__harmony-color-preview"
                        style={{ backgroundColor: triadicColor.hex }}
                      />
                      <div className="color-details-modal__harmony-color-hex">{triadicColor.hex}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="color-details-modal__harmony-section">
                <div className="color-details-modal__harmony-header">
                  <h4 className="color-details-modal__harmony-subtitle">Аналоговые</h4>
                  <p className="color-details-modal__harmony-description">
                    Соседние цвета на цветовом круге (±30°). Создают мягкую, спокойную гармонию.
                  </p>
                </div>
                <div className="color-details-modal__harmony-colors">
                  {getAnalogousColors(color).map((analogousColor) => (
                    <div
                      key={analogousColor.hex}
                      className="color-details-modal__harmony-color-item"
                      onClick={() => onAddToPalette?.(analogousColor.hex)}
                      title="Кликните для добавления в палитру"
                    >
                      <div
                        className="color-details-modal__harmony-color-preview"
                        style={{ backgroundColor: analogousColor.hex }}
                      />
                      <div className="color-details-modal__harmony-color-hex">{analogousColor.hex}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="color-details-modal__footer">
          {onFindRecipe && (
            <Button
              variant="primary"
              onClick={() => {
                onFindRecipe(color.hex)
                onClose()
              }}
            >
              🧪 Подобрать рецепт
            </Button>
          )}
          {onAddToPalette && (
            <Button
              variant="outline"
              onClick={() => {
                onAddToPalette(color.hex)
                onClose()
              }}
            >
              ➕ Добавить в палитру
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ColorDetailsModal

