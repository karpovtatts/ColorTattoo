import { useState, useEffect } from 'react'
import type { Color } from '@/types'
import { createColorFromHex, createColorFromRgb } from '@/utils/colorOperations'
import { validateHex, validateRgb } from '@/utils/colorConversions'
import ColorInput from '@/components/ColorInput/ColorInput'
import RGBInput from '@/components/RGBInput/RGBInput'
import ColorPicker from '@/components/ColorPicker/ColorPicker'
import ColorPreview from '@/components/ColorPreview/ColorPreview'
import Input from '@/components/Input/Input'
import Button from '@/components/Button/Button'
import './AddColorModal.css'

interface AddColorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (color: Color) => void
  editingColor?: Color | null
}

function AddColorModal({
  isOpen,
  onClose,
  onSave,
  editingColor = null,
}: AddColorModalProps) {
  const [hexValue, setHexValue] = useState('')
  const [hexError, setHexError] = useState<string | null>(null)
  const [rgbValue, setRgbValue] = useState({ r: 0, g: 0, b: 0 })
  const [rgbErrors, setRgbErrors] = useState<{
    r?: string
    g?: string
    b?: string
  }>({})
  const [name, setName] = useState('')
  const [currentColor, setCurrentColor] = useState<Color | null>(null)

  // Инициализация при открытии модального окна или редактировании
  useEffect(() => {
    if (isOpen) {
      if (editingColor) {
        setHexValue(editingColor.hex)
        setRgbValue(editingColor.rgb)
        setName(editingColor.name || '')
        setCurrentColor(editingColor)
      } else {
        setHexValue('#000000')
        setRgbValue({ r: 0, g: 0, b: 0 })
        setName('')
        setCurrentColor(createColorFromHex('#000000'))
      }
      setHexError(null)
      setRgbErrors({})
    }
  }, [isOpen, editingColor])

  const handleHexChange = (value: string) => {
    setHexValue(value)
    setHexError(null)

    if (validateHex(value)) {
      try {
        const color = createColorFromHex(value)
        setRgbValue(color.rgb)
        setCurrentColor(color)
      } catch (error) {
        setHexError('Неверный HEX код')
      }
    } else if (value.length > 0) {
      setHexError('Неверный формат HEX')
    }
  }

  const handleRgbChange = (rgb: { r: number; g: number; b: number }) => {
    setRgbValue(rgb)
    setRgbErrors({})

    if (validateRgb(rgb)) {
      try {
        const color = createColorFromRgb(rgb)
        setHexValue(color.hex)
        setCurrentColor(color)
      } catch (error) {
        // Ошибка при конвертации
      }
    }
  }

  const handleColorPickerChange = (color: { hex: string; rgb: { r: number; g: number; b: number } }) => {
    setHexValue(color.hex)
    setRgbValue(color.rgb)
    setHexError(null)
    setRgbErrors({})
    try {
      const newColor = createColorFromHex(color.hex)
      setCurrentColor(newColor)
    } catch (error) {
      // Ошибка при конвертации
    }
  }

  const handleSave = () => {
    if (!currentColor) {
      return
    }

    if (!validateHex(currentColor.hex)) {
      setHexError('Неверный цвет')
      return
    }

    const colorToSave: Color = {
      ...currentColor,
      name: name.trim() || undefined,
      id: editingColor?.id || `color-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }

    onSave(colorToSave)
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="add-color-modal-overlay" onClick={handleCancel}>
      <div
        className="add-color-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="add-color-modal__header">
          <h2>{editingColor ? 'Редактировать цвет' : 'Добавить цвет'}</h2>
          <button
            className="add-color-modal__close"
            onClick={handleCancel}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <div className="add-color-modal__content">
          <div className="add-color-modal__preview">
            <ColorPreview color={currentColor} size="large" />
          </div>

          <div className="add-color-modal__form">
            <Input
              label="Название (необязательно)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Красный"
            />

            <ColorInput
              label="HEX код"
              value={hexValue}
              onChange={handleHexChange}
              error={hexError || undefined}
              placeholder="#RRGGBB"
            />

            <RGBInput
              label="RGB значения"
              value={rgbValue}
              onChange={handleRgbChange}
              errors={rgbErrors}
            />

            <div className="add-color-modal__picker">
              <label className="add-color-modal__picker-label">
                Цветовой пикер
              </label>
              <ColorPicker
                color={currentColor}
                onChange={handleColorPickerChange}
              />
            </div>
          </div>
        </div>

        <div className="add-color-modal__footer">
          <Button variant="outline" onClick={handleCancel}>
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!currentColor || !validateHex(currentColor.hex)}
          >
            {editingColor ? 'Сохранить' : 'Добавить'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AddColorModal

