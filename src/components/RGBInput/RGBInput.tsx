import { useState, useEffect } from 'react'
import Input from '../Input/Input'
import type { RGB } from '@/types'
import './RGBInput.css'

interface RGBInputProps {
  value: RGB
  onChange: (rgb: RGB) => void
  label?: string
  errors?: { r?: string; g?: string; b?: string }
}

function RGBInput({
  value,
  onChange,
  label = 'RGB значения',
  errors = {},
}: RGBInputProps) {
  const [r, setR] = useState(value.r.toString())
  const [g, setG] = useState(value.g.toString())
  const [b, setB] = useState(value.b.toString())

  useEffect(() => {
    setR(value.r.toString())
    setG(value.g.toString())
    setB(value.b.toString())
  }, [value])

  const validateAndUpdate = (
    valueStr: string,
    setter: (val: string) => void,
    channel: 'r' | 'g' | 'b'
  ) => {
    setter(valueStr)

    if (valueStr === '') {
      return
    }

    const numValue = parseInt(valueStr, 10)
    
    if (isNaN(numValue)) {
      return
    }

    const clamped = Math.max(0, Math.min(255, numValue))
    const newRgb = { ...value, [channel]: clamped }
    onChange(newRgb)
  }

  const handleBlur = (channel: 'r' | 'g' | 'b', valueStr: string) => {
    if (valueStr === '') {
      const defaultRgb = { ...value, [channel]: 0 }
      onChange(defaultRgb)
      return
    }

    const numValue = parseInt(valueStr, 10)
    
    if (isNaN(numValue)) {
      const defaultRgb = { ...value, [channel]: 0 }
      onChange(defaultRgb)
      return
    }

    const clamped = Math.max(0, Math.min(255, numValue))
    const newRgb = { ...value, [channel]: clamped }
    onChange(newRgb)
  }

  return (
    <div className="rgb-input">
      {label && <label className="rgb-input__label">{label}</label>}
      <div className="rgb-input__fields">
        <div className="rgb-input__field">
          <Input
            value={r}
            onChange={(e) => validateAndUpdate(e.target.value, setR, 'r')}
            onBlur={(e) => handleBlur('r', e.target.value)}
            label="R"
            error={errors.r}
            type="number"
            min={0}
            max={255}
            placeholder="0"
            className="rgb-input__input"
          />
        </div>
        <div className="rgb-input__field">
          <Input
            value={g}
            onChange={(e) => validateAndUpdate(e.target.value, setG, 'g')}
            onBlur={(e) => handleBlur('g', e.target.value)}
            label="G"
            error={errors.g}
            type="number"
            min={0}
            max={255}
            placeholder="0"
            className="rgb-input__input"
          />
        </div>
        <div className="rgb-input__field">
          <Input
            value={b}
            onChange={(e) => validateAndUpdate(e.target.value, setB, 'b')}
            onBlur={(e) => handleBlur('b', e.target.value)}
            label="B"
            error={errors.b}
            type="number"
            min={0}
            max={255}
            placeholder="0"
            className="rgb-input__input"
          />
        </div>
      </div>
    </div>
  )
}

export default RGBInput

