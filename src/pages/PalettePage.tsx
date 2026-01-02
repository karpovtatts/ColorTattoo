import { useState } from 'react'
import Container from '@/components/Container/Container'
import Button from '@/components/Button/Button'
import ColorSwatch from '@/components/ColorSwatch/ColorSwatch'
import AddColorModal from '@/components/AddColorModal/AddColorModal'
import { usePaletteContext } from '@/contexts/PaletteContext'
import type { Color } from '@/types'
import './PalettePage.css'

function PalettePage() {
  const {
    palette,
    addColor,
    updateColor,
    removeColor,
    clearPalette,
    resetToDefault,
    validation,
  } = usePaletteContext()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingColor, setEditingColor] = useState<Color | null>(null)

  const handleAddColor = () => {
    setEditingColor(null)
    setIsModalOpen(true)
  }

  const handleEditColor = (color: Color) => {
    setEditingColor(color)
    setIsModalOpen(true)
  }

  const handleDeleteColor = (id: string) => {
    removeColor(id)
  }

  const handleSaveColor = (color: Color) => {
    if (editingColor) {
      updateColor(editingColor.id, color)
    } else {
      addColor(color)
    }
    setIsModalOpen(false)
    setEditingColor(null)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingColor(null)
  }

  const handleClearPalette = () => {
    if (
      confirm(
        'Вы уверены, что хотите очистить всю палитру? Это действие нельзя отменить.'
      )
    ) {
      clearPalette()
    }
  }

  const handleResetToDefault = () => {
    if (
      confirm(
        'Вы уверены, что хотите сбросить палитру к значениям по умолчанию? Текущая палитра будет заменена.'
      )
    ) {
      resetToDefault()
    }
  }

  return (
    <Container>
      <div className="palette-page">
        <div className="palette-page__header">
          <div>
            <h1 className="palette-page__title">Настройка палитры</h1>
            <p className="palette-page__description">
              Добавьте цвета, которые у вас есть в наличии. Минимум 2 цвета
              для работы приложения.
            </p>
          </div>
          <div className="palette-page__actions">
            <Button variant="primary" onClick={handleAddColor}>
              + Добавить цвет
            </Button>
          </div>
        </div>

        {validation.errors.length > 0 && (
          <div className="palette-page__validation palette-page__validation--error">
            <h3>Ошибки валидации:</h3>
            <ul>
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {validation.warnings.length > 0 && (
          <div className="palette-page__validation palette-page__validation--warning">
            <h3>Предупреждения:</h3>
            <ul>
              {validation.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {palette.colors.length === 0 ? (
          <div className="palette-page__empty">
            <p className="palette-page__empty-text">
              Палитра пуста. Добавьте цвета, чтобы начать работу.
            </p>
            <Button variant="outline" onClick={resetToDefault}>
              Загрузить палитру по умолчанию
            </Button>
          </div>
        ) : (
          <>
            <div className="palette-page__info">
              <span className="palette-page__count">
                Цветов в палитре: {palette.colors.length}
              </span>
              {validation.isValid && (
                <span className="palette-page__status palette-page__status--valid">
                  ✓ Палитра валидна
                </span>
              )}
            </div>

            <div className="palette-page__grid">
              {palette.colors.map((color) => (
                <ColorSwatch
                  key={color.id}
                  color={color}
                  onEdit={handleEditColor}
                  onDelete={handleDeleteColor}
                />
              ))}
            </div>

            <div className="palette-page__footer-actions">
              <Button variant="outline" onClick={handleResetToDefault}>
                Сбросить к умолчанию
              </Button>
              <Button variant="danger" onClick={handleClearPalette}>
                Очистить палитру
              </Button>
            </div>
          </>
        )}

        <AddColorModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveColor}
          editingColor={editingColor}
        />
      </div>
    </Container>
  )
}

export default PalettePage
