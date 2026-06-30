import { useState } from 'react'
import { SketchPicker, ColorResult } from 'react-color'
import type { Color } from '@/types'
import { createColorFromRgb } from '@/utils/colorOperations'
import './ColorPicker.css'

interface ColorPickerProps {
  color: Color | null
  onChange: (color: Color) => void
  presetColors?: string[]
  // Управляемый режим (попап с оверлеем)
  open?: boolean
  onOpenChange?: (v: boolean) => void
  // Инлайн-режим: рендерит SketchPicker напрямую без попапа
  inline?: boolean
  // Кастомный триггер: получает toggle и isOpen
  renderTrigger?: (toggle: () => void, isOpen: boolean) => React.ReactNode
}

function ColorPicker({ color, onChange, presetColors, open: openProp, onOpenChange, inline, renderTrigger }: ColorPickerProps) {
  const [isOpenLocal, setIsOpenLocal] = useState(false)

  const isControlled = openProp !== undefined
  const isOpen = isControlled ? openProp : isOpenLocal

  const close = () => {
    if (isControlled) onOpenChange?.(false)
    else setIsOpenLocal(false)
  }

  const toggle = () => {
    if (isControlled) onOpenChange?.(!openProp)
    else setIsOpenLocal((v) => !v)
  }

  const handleColorChange = (colorResult: ColorResult) => {
    const newColor = createColorFromRgb(
      {
        r: colorResult.rgb.r || 0,
        g: colorResult.rgb.g || 0,
        b: colorResult.rgb.b || 0,
      },
      color?.id,
      color?.name
    )
    onChange(newColor)
  }

  const currentColor = color
    ? { r: color.rgb.r, g: color.rgb.g, b: color.rgb.b, a: 1 }
    : { r: 128, g: 128, b: 128, a: 1 }

  // Инлайн-режим: рендерит пикер без обёртки, стандартная ширина
  if (inline) {
    return (
      <SketchPicker
        color={currentColor}
        onChange={handleColorChange}
        presetColors={presetColors}
        disableAlpha
      />
    )
  }

  return (
    <div className={`color-picker${isControlled ? ' color-picker--controlled' : ''}`}>
      {renderTrigger
        ? renderTrigger(toggle, isOpen)
        : !isControlled && (
            <div className="color-picker__trigger" onClick={toggle}>
              <div
                className="color-picker__preview"
                style={{ backgroundColor: color?.hex || '#808080' }}
              />
              <span className="color-picker__label">
                {isOpen ? 'Скрыть палитру' : 'Выбрать цвет'}
              </span>
            </div>
          )}
      {isOpen && (
        <div className="color-picker__popover">
          <div className="color-picker__cover" onClick={close} />
          <div className="color-picker__panel">
            <div className="color-picker__panel-header">
              <span className="color-picker__panel-title">Выбор цвета</span>
              <button
                type="button"
                className="color-picker__close"
                onClick={close}
                aria-label="Закрыть палитру"
              >
                ×
              </button>
            </div>
            <SketchPicker
              color={currentColor}
              onChange={handleColorChange}
              presetColors={presetColors}
              disableAlpha
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ColorPicker
