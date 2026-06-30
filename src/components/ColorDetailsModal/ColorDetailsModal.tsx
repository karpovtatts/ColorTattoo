import { useEffect, useState, useMemo, useRef } from 'react'
import type { Color } from '@/types'
import {
  createColorFromHex,
  getColorNameFromHue,
  getComplementaryColorForHarmony,
  getTriadicColors,
  getAnalogousColors,
  isWhiteColor,
  isBlackInk,
} from '@/utils/colorOperations'
import { rgbToCmyk } from '@/utils/colorConversions'
import { getTemperatureLabel, getSaturationLabel, getLightnessLabel } from '@/utils/colorTraits'
import Button from '@/components/Button/Button'
import './ColorDetailsModal.css'

interface ColorDetailsModalProps {
  isOpen: boolean
  colorHex: string
  onClose: () => void
  onAddToPalette?: (hex: string) => void
  onFindRecipe?: (hex: string) => void
}

function needsLightText(color: Color): boolean {
  return color.hsl.l < 50
}

function ColorDetailsModal({
  isOpen,
  colorHex,
  onClose,
  onAddToPalette,
  onFindRecipe,
}: ColorDetailsModalProps) {
  // A2-altitude fix: synchronously derived from prop — useMemo instead of useState+useEffect
  const color = useMemo(() => {
    if (!isOpen || !colorHex) return null
    try { return createColorFromHex(colorHex) } catch { return null }
  }, [isOpen, colorHex])

  const [copiedFormat, setCopiedFormat] = useState<string | null>(null)
  // B5 fix: track recently-added swatch hex codes for visual feedback
  const [addedSwatches, setAddedSwatches] = useState<Set<string>>(new Set())
  const swatchTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  // B5 fix: clear swatch state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAddedSwatches(new Set())
      swatchTimers.current.forEach(clearTimeout)
      swatchTimers.current.clear()
    }
  }, [isOpen])

  const character = useMemo(() => {
    if (!color) return null
    const temperatureTrait = getTemperatureLabel(color)
    const saturationTrait = getSaturationLabel(color)
    const lightnessTrait = getLightnessLabel(color)
    // R2 fix: use isWhiteColor (l > 70 AND s < 20) for fade risk, not bare l > 70
    const fadeRisk = isWhiteColor(color)
    const isWhite = isWhiteColor(color)
    const isBlack = isBlackInk(color)
    return { temperatureTrait, saturationTrait, lightnessTrait, fadeRisk, isWhite, isBlack }
  }, [color])

  const handleCopy = async (text: string, format: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedFormat(format)
      setTimeout(() => setCopiedFormat(null), 1800)
    } catch { /* noop */ }
  }

  // B5 fix: swatch add with brief visual confirmation, dedup timer per hex
  const handleAddSwatch = (hex: string) => {
    onAddToPalette?.(hex)
    setAddedSwatches(prev => new Set(prev).add(hex))
    const prev = swatchTimers.current.get(hex)
    if (prev) clearTimeout(prev)
    const id = setTimeout(() => {
      setAddedSwatches(prev => {
        const next = new Set(prev)
        next.delete(hex)
        return next
      })
      swatchTimers.current.delete(hex)
    }, 1500)
    swatchTimers.current.set(hex, id)
  }

  if (!isOpen || !color || !character) return null

  // A5 fix: show semantically correct name for black/white instead of getColorNameFromHue(0) = "красный"
  const displayName = character.isBlack
    ? 'чёрный пигмент'
    : character.isWhite
    ? 'белый / разбавитель'
    : getColorNameFromHue(color.hsl.h)

  const cmyk = rgbToCmyk(color.rgb)
  const lightText = needsLightText(color)

  const formatRgb = () => `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`
  const formatHsl = () => `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`
  const formatCmyk = () => `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`

  const complementary = getComplementaryColorForHarmony(color)
  // C6 fix: slice(1) to skip the first element which is the original color itself
  const triadic = getTriadicColors(color).slice(1)
  const analogous = getAnalogousColors(color)

  return (
    <div className="cdm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div
        className="cdm"
        role="dialog"
        aria-modal="true"
        aria-label="Информация о цвете"
        onClick={e => e.stopPropagation()}
      >
        <div
          className={`cdm__band${lightText ? ' cdm__band--light-text' : ''}`}
          style={{ background: color.hex }}
        >
          <div className="cdm__band-content">
            <div className="cdm__band-hex-row">
              <span className="cdm__band-hex">{color.hex}</span>
              <button
                className="cdm__band-copy"
                onClick={() => handleCopy(color.hex, 'hex')}
                aria-label="Скопировать HEX"
              >
                {copiedFormat === 'hex' ? (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                    <path d="M1.5 6.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <rect x="1" y="4" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M4 4V3a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            </div>
            {/* A5 fix: display semantically correct name, not hue-derived "красный" for black/white */}
            <div className="cdm__band-name">{displayName}</div>
          </div>
          <button className="cdm__close" onClick={onClose} aria-label="Закрыть">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="cdm__body">
          <div className="cdm__character">
            {character.isWhite ? (
              <div className="cdm__trait-row">
                <span className="cdm__trait-label">Тип</span>
                <span className="cdm__trait-value">Белый / Разбавитель</span>
              </div>
            ) : character.isBlack ? (
              <div className="cdm__trait-row">
                <span className="cdm__trait-label">Тип</span>
                <span className="cdm__trait-value">Чёрный пигмент</span>
              </div>
            ) : (
              <div className="cdm__trait-group">
                <div className="cdm__trait-row">
                  <span className="cdm__trait-label">Температура</span>
                  <span className={`cdm__trait-value cdm__trait-value--${character.temperatureTrait.key}`}>
                    {character.temperatureTrait.label}
                  </span>
                </div>
                <div className="cdm__trait-row">
                  <span className="cdm__trait-label">Насыщенность</span>
                  <span className={`cdm__trait-value cdm__trait-value--${character.saturationTrait.key}`}>
                    {character.saturationTrait.label}
                  </span>
                </div>
                <div className="cdm__trait-row">
                  <span className="cdm__trait-label">Светлота</span>
                  <span className={`cdm__trait-value cdm__trait-value--${character.lightnessTrait.key}`}>
                    {character.lightnessTrait.label}
                  </span>
                </div>
              </div>
            )}

            {character.fadeRisk && (
              <div className="cdm__warn" role="alert">
                <span aria-hidden="true">⚠</span>
                <span>Светлые цвета быстрее выцветают в коже</span>
              </div>
            )}
          </div>

          <details className="cdm__details">
            <summary className="cdm__details-summary">Форматы (RGB, HSL, CMYK)</summary>
            <div className="cdm__details-content">
              {[
                { label: 'HEX', value: color.hex, format: 'hex-detail' },
                { label: 'RGB', value: formatRgb(), format: 'rgb' },
                { label: 'HSL', value: formatHsl(), format: 'hsl' },
                { label: 'CMYK', value: formatCmyk(), format: 'cmyk' },
              ].map(({ label, value, format }) => (
                <div key={format} className="cdm__format-row">
                  <span className="cdm__format-label">{label}</span>
                  <code className="cdm__format-value">{value}</code>
                  <button
                    className={`cdm__format-copy${copiedFormat === format ? ' cdm__format-copy--done' : ''}`}
                    onClick={() => handleCopy(value, format)}
                    aria-label={`Скопировать ${label}`}
                  >
                    {copiedFormat === format ? '✓' : 'Копировать'}
                  </button>
                </div>
              ))}
            </div>
          </details>

          <div className="cdm__section">
            <h3 className="cdm__section-title">Гармония</h3>

            <div className="cdm__harmony-block">
              <div className="cdm__harmony-label">Дополнительный</div>
              <div className="cdm__harmony-swatches">
                <button
                  className={`cdm__swatch${addedSwatches.has(complementary.hex) ? ' cdm__swatch--added' : ''}`}
                  style={{ background: complementary.hex }}
                  onClick={() => handleAddSwatch(complementary.hex)}
                  title={`Добавить ${complementary.hex} в палитру`}
                  aria-label={`Добавить ${complementary.hex} в палитру`}
                >
                  <span className="cdm__swatch-hex">
                    {addedSwatches.has(complementary.hex) ? '✓' : complementary.hex}
                  </span>
                </button>
              </div>
            </div>

            <div className="cdm__harmony-block">
              {/* C6 fix: slice(1) already applied above — triadic no longer includes the original */}
              <div className="cdm__harmony-label">Триада</div>
              <div className="cdm__harmony-swatches">
                {triadic.map(c => (
                  <button
                    key={c.hex}
                    className={`cdm__swatch${addedSwatches.has(c.hex) ? ' cdm__swatch--added' : ''}`}
                    style={{ background: c.hex }}
                    onClick={() => handleAddSwatch(c.hex)}
                    title={`Добавить ${c.hex} в палитру`}
                    aria-label={`Добавить ${c.hex} в палитру`}
                  >
                    <span className="cdm__swatch-hex">
                      {addedSwatches.has(c.hex) ? '✓' : c.hex}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="cdm__harmony-block">
              <div className="cdm__harmony-label">Аналоговые</div>
              <div className="cdm__harmony-swatches">
                {analogous.map(c => (
                  <button
                    key={c.hex}
                    className={`cdm__swatch${addedSwatches.has(c.hex) ? ' cdm__swatch--added' : ''}`}
                    style={{ background: c.hex }}
                    onClick={() => handleAddSwatch(c.hex)}
                    title={`Добавить ${c.hex} в палитру`}
                    aria-label={`Добавить ${c.hex} в палитру`}
                  >
                    <span className="cdm__swatch-hex">
                      {addedSwatches.has(c.hex) ? '✓' : c.hex}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="cdm__footer">
          {onFindRecipe && (
            <Button
              variant="primary"
              onClick={() => { onFindRecipe(color.hex); onClose() }}
            >
              Подобрать рецепт
            </Button>
          )}
          {onAddToPalette && (
            <Button
              variant="outline"
              onClick={() => { onAddToPalette(color.hex); onClose() }}
            >
              В палитру
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Закрыть</Button>
        </div>
      </div>
    </div>
  )
}

export default ColorDetailsModal
