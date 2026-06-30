import { useState, useEffect, useMemo } from 'react'
import { HexColorPicker } from 'react-colorful'
import type { Color } from '@/types'
import { createColorFromHex, isWhiteColor, isBlackInk, deltaE } from '@/utils/colorOperations'
import { validateHex } from '@/utils/colorConversions'
import { getTemperatureLabel, getSaturationLabel, getLightnessLabel } from '@/utils/colorTraits'
import { usePaletteContext } from '@/contexts/PaletteContext'
import Input from '@/components/Input/Input'
import Button from '@/components/Button/Button'
import './AddColorModal.css'

interface AddColorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (color: Color) => void
  editingColor?: Color | null
}

function AddColorModal({ isOpen, onClose, onSave, editingColor = null }: AddColorModalProps) {
  const { palette } = usePaletteContext()
  const [hexValue, setHexValue] = useState('#000000')
  const [name, setName] = useState('')
  const [currentColor, setCurrentColor] = useState<Color>(() => createColorFromHex('#000000'))
  // E1 fix: separate debounced color so deltaE scan doesn't run on every picker frame
  const [debouncedColor, setDebouncedColor] = useState<Color>(() => createColorFromHex('#000000'))
  const [copied, setCopied] = useState(false)
  // B1 fix: track hex input focus to prevent picker from overwriting mid-type value
  const [hexInputFocused, setHexInputFocused] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const initial = editingColor?.hex ?? '#000000'
    const initialColor = createColorFromHex(initial)
    setHexValue(initial)
    setName(editingColor?.name ?? '')
    setCurrentColor(initialColor)
    setDebouncedColor(initialColor)
  }, [isOpen, editingColor])

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

  // E1 fix: 180ms debounce before running expensive deltaE scan
  useEffect(() => {
    const id = setTimeout(() => setDebouncedColor(currentColor), 180)
    return () => clearTimeout(id)
  }, [currentColor])

  const handlePickerChange = (hex: string) => {
    const upper = hex.toUpperCase()
    // B1 fix: don't stomp what the user is typing in the hex input
    if (!hexInputFocused) {
      setHexValue(upper)
    }
    if (validateHex(upper)) {
      try { setCurrentColor(createColorFromHex(upper)) } catch { /* noop */ }
    }
  }

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase()
    setHexValue(val)
    if (validateHex(val)) {
      try { setCurrentColor(createColorFromHex(val)) } catch { /* noop */ }
    }
  }

  // B1 fix: restore hex field to valid value when user leaves without completing a valid hex
  const handleHexInputBlur = () => {
    setHexInputFocused(false)
    if (!validateHex(hexValue)) {
      setHexValue(currentColor.hex)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentColor.hex)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* noop */ }
  }

  // B6 fix: save from hexValue (what the user sees), not stale currentColor
  const handleSave = () => {
    if (!validateHex(hexValue)) return
    let colorToSave = currentColor
    if (hexValue !== currentColor.hex) {
      try { colorToSave = createColorFromHex(hexValue) } catch { return }
    }
    onSave({
      ...colorToSave,
      name: name.trim() || undefined,
      id: editingColor?.id ?? `color-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    })
    onClose()
  }

  // E1 fix: duplicate scan uses debounced color, not live currentColor
  const duplicate = useMemo(() => {
    const sourceLab = debouncedColor.lab
    if (!sourceLab) return null
    return palette.colors.find((c: Color) => {
      if (c.id === editingColor?.id) return false
      if (!c.lab) return false
      return deltaE(sourceLab, c.lab) < 8
    }) ?? null
  }, [debouncedColor, palette, editingColor])

  // E2 fix: memoize trait computations so they don't rerun on name-field keystrokes
  const traits = useMemo(() => {
    const temperatureTrait = getTemperatureLabel(currentColor)
    const saturationTrait = getSaturationLabel(currentColor)
    const lightnessTrait = getLightnessLabel(currentColor)
    const isWhite = isWhiteColor(currentColor)
    // Светлые ХРОМАТИЧЕСКИЕ цвета выцветают; белый сам по себе — разбавитель, предупреждение не нужно
    const fadeRisk = !isWhite && !isBlackInk(currentColor) && currentColor.hsl.l > 70
    const isBlack = isBlackInk(currentColor)
    return { temperatureTrait, saturationTrait, lightnessTrait, fadeRisk, isWhite, isBlack }
  }, [currentColor])

  if (!isOpen) return null

  const pickerHex = currentColor.hex.toLowerCase()
  const { rgb, hsl } = currentColor

  return (
    <div className="acm-overlay" onClick={onClose}>
      <div
        className="acm"
        role="dialog"
        aria-modal="true"
        aria-label={editingColor ? 'Редактировать цвет' : 'Добавить цвет'}
        onClick={e => e.stopPropagation()}
      >
        <div className="acm__header">
          <h2 className="acm__title">{editingColor ? 'Редактировать цвет' : 'Добавить цвет'}</h2>
          <button className="acm__close" onClick={onClose} aria-label="Закрыть">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M1 1l16 16M17 1L1 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="acm__body">
          <div className="acm__picker-col">
            <HexColorPicker color={pickerHex} onChange={handlePickerChange} />
          </div>

          <div className="acm__info-col">
            <div className="acm__hex-row">
              <span
                className="acm__hex-swatch"
                style={{ background: currentColor.hex }}
                aria-hidden="true"
              />
              <input
                className="acm__hex-input"
                type="text"
                value={hexValue}
                onChange={handleHexInputChange}
                onFocus={() => setHexInputFocused(true)}
                onBlur={handleHexInputBlur}
                maxLength={7}
                spellCheck={false}
                aria-label="HEX-код цвета"
              />
              <button
                className={`acm__copy-btn${copied ? ' acm__copy-btn--done' : ''}`}
                onClick={handleCopy}
                aria-label="Скопировать HEX"
                title="Скопировать HEX"
              >
                {copied ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 7l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <rect x="1" y="4" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M4 4V3a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            </div>

            <div className="acm__character" aria-label="Характер цвета">
              {traits.isWhite ? (
                <div className="acm__trait-row">
                  <span className="acm__trait-label">Тип</span>
                  <span className="acm__trait-value">Белый / Разбавитель</span>
                </div>
              ) : traits.isBlack ? (
                <div className="acm__trait-row">
                  <span className="acm__trait-label">Тип</span>
                  <span className="acm__trait-value">Чёрный пигмент</span>
                </div>
              ) : (
                <>
                  <div className="acm__trait-row">
                    <span className="acm__trait-label">Температура</span>
                    <span className={`acm__trait-value acm__trait-value--${traits.temperatureTrait.key}`}>
                      {traits.temperatureTrait.label}
                    </span>
                  </div>
                  <div className="acm__trait-row">
                    <span className="acm__trait-label">Насыщенность</span>
                    <span className={`acm__trait-value acm__trait-value--${traits.saturationTrait.key}`}>
                      {traits.saturationTrait.label}
                    </span>
                  </div>
                  <div className="acm__trait-row">
                    <span className="acm__trait-label">Светлота</span>
                    <span className={`acm__trait-value acm__trait-value--${traits.lightnessTrait.key}`}>
                      {traits.lightnessTrait.label}
                    </span>
                  </div>
                </>
              )}

              {traits.fadeRisk && (
                <div className="acm__warn" role="alert">
                  <span className="acm__warn-icon" aria-hidden="true">⚠</span>
                  <span>Светлые цвета быстрее выцветают в коже</span>
                </div>
              )}
              {duplicate && (
                <div className="acm__warn" role="alert">
                  <span className="acm__warn-icon" aria-hidden="true">⚠</span>
                  <span>
                    Похож на{' '}
                    <strong>{duplicate.name ?? duplicate.hex}</strong>{' '}
                    в вашей палитре
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="acm__name-row">
          <Input
            label="Название (необязательно)"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Например: Тёплый золотой"
            fullWidth
          />
        </div>

        <details className="acm__details">
          <summary className="acm__details-summary">Подробнее: RGB / HSL</summary>
          <div className="acm__details-content">
            <div className="acm__details-row">
              <span className="acm__details-label">RGB</span>
              <code className="acm__details-value">{rgb.r}, {rgb.g}, {rgb.b}</code>
            </div>
            <div className="acm__details-row">
              <span className="acm__details-label">HSL</span>
              <code className="acm__details-value">H {hsl.h}°  S {hsl.s}%  L {hsl.l}%</code>
            </div>
          </div>
        </details>

        <div className="acm__footer">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          {/* B6 fix: disabled checks hexValue (what user sees), not stale currentColor */}
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!validateHex(hexValue)}
          >
            {editingColor ? 'Сохранить' : 'Добавить'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AddColorModal
