import { useState } from 'react'
import type { Color } from '@/types'
import Button from '@/components/Button/Button'
import './ColorSwatch.css'

interface ColorSwatchProps {
  color: Color
  onEdit?: (color: Color) => void
  onDelete?: (id: string) => void
  showActions?: boolean
}

function ColorSwatch({
  color,
  onEdit,
  onDelete,
  showActions = true,
}: ColorSwatchProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const handleEdit = () => {
    onEdit?.(color)
  }

  const handleDelete = () => {
    if (confirm(`Удалить цвет "${color.name || color.hex}"?`)) {
      onDelete?.(color.id)
    }
  }

  return (
    <div
      className="color-swatch"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className="color-swatch__preview"
        style={{ backgroundColor: color.hex }}
        title={color.name || color.hex}
      >
        {showTooltip && (
          <div className="color-swatch__tooltip">
            <div className="color-swatch__tooltip-hex">{color.hex}</div>
            {color.name && (
              <div className="color-swatch__tooltip-name">{color.name}</div>
            )}
            <div className="color-swatch__tooltip-rgb">
              RGB: {color.rgb.r}, {color.rgb.g}, {color.rgb.b}
            </div>
          </div>
        )}
      </div>
      {color.name && (
        <div className="color-swatch__name" title={color.name}>
          {color.name}
        </div>
      )}
      {showActions && (
        <div className="color-swatch__actions">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="color-swatch__action"
              title="Редактировать"
            >
              ✏️
            </Button>
          )}
          {onDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              className="color-swatch__action"
              title="Удалить"
            >
              🗑️
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default ColorSwatch

