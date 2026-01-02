import type { Color } from '@/types'
import './ColorPreview.css'

interface ColorPreviewProps {
  color: Color | null
  size?: 'small' | 'medium' | 'large'
  showHex?: boolean
  showRgb?: boolean
  label?: string
}

function ColorPreview({
  color,
  size = 'medium',
  showHex = true,
  showRgb = false,
  label,
}: ColorPreviewProps) {
  if (!color) {
    return (
      <div className={`color-preview color-preview--${size}`}>
        {label && <span className="color-preview__label">{label}</span>}
        <div className="color-preview__swatch color-preview__swatch--empty">
          <span className="color-preview__empty-text">Нет цвета</span>
        </div>
        {showHex && <span className="color-preview__code">—</span>}
        {showRgb && <span className="color-preview__code">—</span>}
      </div>
    )
  }

  const rgbString = `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`

  return (
    <div className={`color-preview color-preview--${size}`}>
      {label && <span className="color-preview__label">{label}</span>}
      <div
        className="color-preview__swatch"
        style={{ backgroundColor: color.hex }}
        title={color.name || color.hex}
      />
      {showHex && (
        <span className="color-preview__code" title="HEX">
          {color.hex}
        </span>
      )}
      {showRgb && (
        <span className="color-preview__code" title="RGB">
          {rgbString}
        </span>
      )}
    </div>
  )
}

export default ColorPreview

