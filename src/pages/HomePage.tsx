import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Container from '@/components/Container/Container'
import {
  ColorInput,
  RGBInput,
  ColorPreview,
  ColorPicker,
  Button,
} from '@/components'
import { useColorContext } from '@/contexts/ColorContext'
import { createColorFromHex, createColorFromRgb } from '@/utils/colorOperations'
import { validateHex } from '@/utils/colorConversions'
import './HomePage.css'

function HomePage() {
  const navigate = useNavigate()
  const { targetColor, setTargetColor } = useColorContext()

  const [hexValue, setHexValue] = useState(targetColor?.hex || '')
  const [rgbValue, setRgbValue] = useState(
    targetColor?.rgb || { r: 128, g: 128, b: 128 }
  )
  const [hexError, setHexError] = useState('')
  const [rgbErrors, setRgbErrors] = useState<{ r?: string; g?: string; b?: string }>({})

  // Синхронизация с контекстом при изменении targetColor извне
  useEffect(() => {
    if (targetColor) {
      setHexValue(targetColor.hex)
      setRgbValue(targetColor.rgb)
    }
  }, [targetColor])

  const handleHexChange = (hex: string) => {
    setHexValue(hex)
    setHexError('')

    if (hex === '') {
      setTargetColor(null)
      return
    }

    try {
      if (validateHex(hex)) {
        const color = createColorFromHex(hex)
        setTargetColor(color)
        setRgbValue(color.rgb)
        setHexError('')
      }
    } catch (error) {
      setHexError('Неверный формат HEX')
    }
  }

  const handleRgbChange = (rgb: { r: number; g: number; b: number }) => {
    setRgbValue(rgb)
    setRgbErrors({})

    try {
      const color = createColorFromRgb(rgb)
      setTargetColor(color)
      setHexValue(color.hex)
    } catch (error) {
      // Ошибка уже обработана в RGBInput
    }
  }

  const handleColorPickerChange = (color: ReturnType<typeof createColorFromRgb>) => {
    setTargetColor(color)
    setHexValue(color.hex)
    setRgbValue(color.rgb)
    setHexError('')
    setRgbErrors({})
  }

  const handleFindRecipe = () => {
    if (targetColor) {
      navigate('/recipe')
    }
  }

  const isColorValid = targetColor !== null

  return (
    <Container>
      <div className="home-page">
        <h1 className="home-page__title">ColorTattoo</h1>
        <p className="home-page__subtitle">
          Помощник по смешиванию цветов для тату-мастеров
        </p>

        <div className="home-page__form">
          <h2 className="home-page__form-title">Введите целевой цвет</h2>

          <div className="home-page__color-picker-section">
            <ColorPicker
              color={targetColor}
              onChange={handleColorPickerChange}
            />
          </div>

          <div className="home-page__preview-section">
            <ColorPreview
              color={targetColor}
              size="large"
              showHex
              showRgb
              label="Предпросмотр цвета"
            />
          </div>

          <div className="home-page__inputs-section">
            <div className="home-page__input-group">
              <ColorInput
                value={hexValue}
                onChange={handleHexChange}
                label="HEX код"
                error={hexError}
                placeholder="#RRGGBB"
              />
            </div>

            <div className="home-page__input-group">
              <RGBInput
                value={rgbValue}
                onChange={handleRgbChange}
                label="RGB значения"
                errors={rgbErrors}
              />
            </div>
          </div>

          <div className="home-page__actions">
            <Button
              onClick={handleFindRecipe}
              disabled={!isColorValid}
              variant="primary"
              fullWidth
            >
              Найти рецепт
            </Button>
          </div>

          {!isColorValid && (
            <p className="home-page__hint">
              Введите цвет через HEX код, RGB значения или выберите из палитры
            </p>
          )}
        </div>
      </div>
    </Container>
  )
}

export default HomePage
