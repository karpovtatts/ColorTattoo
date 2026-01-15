import { useState } from 'react'
import { SketchPicker, ColorResult } from 'react-color'
import type { Color } from '@/types'
import { createColorFromRgb } from '@/utils/colorOperations'
import './ColorPicker.css'

interface ColorPickerProps {
  color: Color | null
  onChange: (color: Color) => void
  presetColors?: string[]
}

function ColorPicker({
  color,
  onChange,
  presetColors,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

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
    ? {
        r: color.rgb.r,
        g: color.rgb.g,
        b: color.rgb.b,
        a: 1,
      }
    : { r: 128, g: 128, b: 128, a: 1 }

  return (
    <div className="color-picker">
      <div className="color-picker__trigger" onClick={() => setIsOpen(!isOpen)}>
        <div
          className="color-picker__preview"
          style={{
            backgroundColor: color?.hex || '#808080',
          }}
        />
        <span className="color-picker__label">
          {isOpen ? 'Скрыть палитру' : 'Выбрать цвет'}
        </span>
      </div>
      {isOpen && (
        <div className="color-picker__popover">
          <div
            className="color-picker__cover"
            onClick={() => setIsOpen(false)}
          />
          <div className="color-picker__panel">
            <div className="color-picker__panel-header">
              <span className="color-picker__panel-title">Выбор цвета</span>
              <button
                type="button"
                className="color-picker__close"
                onClick={() => setIsOpen(false)}
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
