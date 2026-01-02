import { useState, useEffect } from 'react'
import Input from '../Input/Input'
import { validateHex, normalizeHex } from '@/utils/colorConversions'
import './ColorInput.css'

interface ColorInputProps {
  value: string
  onChange: (hex: string) => void
  label?: string
  error?: string
  placeholder?: string
}

function ColorInput({
  value,
  onChange,
  label = 'HEX код',
  error: externalError,
  placeholder = '#RRGGBB',
}: ColorInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const [internalError, setInternalError] = useState<string>('')

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setLocalValue(inputValue)

    // Валидация в реальном времени
    if (inputValue === '') {
      setInternalError('')
      return
    }

    // Проверка формата (может быть с # или без)
    const cleanValue = inputValue.replace('#', '').toUpperCase()
    
    if (cleanValue.length > 6) {
      setInternalError('HEX код должен содержать 6 символов')
      return
    }

    // Проверка на валидные символы
    if (cleanValue.length > 0 && !/^[0-9A-F]*$/.test(cleanValue)) {
      setInternalError('HEX код может содержать только цифры и буквы A-F')
      return
    }

    setInternalError('')
  }

  const handleBlur = () => {
    if (localValue === '') {
      setInternalError('')
      onChange('')
      return
    }

    try {
      // Нормализация и валидация
      const normalized = normalizeHex(localValue)
      
      if (validateHex(normalized)) {
        setLocalValue(normalized)
        setInternalError('')
        onChange(normalized)
      } else {
        setInternalError('Неверный формат HEX. Используйте формат #RRGGBB')
      }
    } catch (err) {
      setInternalError('Неверный формат HEX. Используйте формат #RRGGBB')
    }
  }

  const displayError = externalError || internalError

  return (
    <Input
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      label={label}
      error={displayError}
      placeholder={placeholder}
      className="color-input"
    />
  )
}

export default ColorInput

