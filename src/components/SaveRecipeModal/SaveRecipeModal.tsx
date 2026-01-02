import { useState, useEffect } from 'react'
import type { Recipe } from '@/types'
import Input from '@/components/Input/Input'
import Button from '@/components/Button/Button'
import './SaveRecipeModal.css'

interface SaveRecipeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, notes: string) => void
  recipe: Recipe | null
  defaultName?: string
  defaultNotes?: string
}

function SaveRecipeModal({
  isOpen,
  onClose,
  onSave,
  recipe,
  defaultName = '',
  defaultNotes = '',
}: SaveRecipeModalProps) {
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')

  // Инициализация при открытии модального окна
  useEffect(() => {
    if (isOpen && recipe) {
      // Автогенерация названия, если не указано
      const autoName = defaultName || `Рецепт для ${recipe.targetColor.hex}`
      setName(autoName)
      setNotes(defaultNotes || recipe.notes || '')
    }
  }, [isOpen, recipe, defaultName, defaultNotes])

  const handleSave = () => {
    if (!recipe) {
      return
    }

    onSave(name.trim() || `Рецепт для ${recipe.targetColor.hex}`, notes.trim())
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  if (!isOpen || !recipe) {
    return null
  }

  return (
    <div className="save-recipe-modal-overlay" onClick={handleCancel}>
      <div
        className="save-recipe-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="save-recipe-modal__header">
          <h2>Сохранить рецепт</h2>
          <button
            className="save-recipe-modal__close"
            onClick={handleCancel}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <div className="save-recipe-modal__content">
          <div className="save-recipe-modal__preview">
            <div className="save-recipe-modal__color-preview">
              <div
                className="save-recipe-modal__color-swatch"
                style={{ backgroundColor: recipe.targetColor.hex }}
              />
              <div className="save-recipe-modal__color-info">
                <div className="save-recipe-modal__color-hex">
                  {recipe.targetColor.hex}
                </div>
                {recipe.targetColor.name && (
                  <div className="save-recipe-modal__color-name">
                    {recipe.targetColor.name}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="save-recipe-modal__form">
            <Input
              label="Название рецепта"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Рецепт для ${recipe.targetColor.hex}`}
            />

            <div className="save-recipe-modal__notes">
              <label className="save-recipe-modal__notes-label">
                Заметки (необязательно)
              </label>
              <textarea
                className="save-recipe-modal__notes-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Добавьте заметки о рецепте, например: 'Использовать для фона', 'Смешивать медленно' и т.д."
                rows={5}
              />
            </div>
          </div>
        </div>

        <div className="save-recipe-modal__footer">
          <Button variant="outline" onClick={handleCancel}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SaveRecipeModal

