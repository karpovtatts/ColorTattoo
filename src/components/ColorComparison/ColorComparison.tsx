import type { Color } from '@/types'
import { ColorPreview } from '@/components'
import { calculateColorDistanceFull } from '@/utils/colorOperations'
import './ColorComparison.css'

interface ColorComparisonProps {
  targetColor: Color
  resultColor: Color
  showDistance?: boolean
  showLabels?: boolean
  size?: 'small' | 'medium' | 'large'
}

function ColorComparison({
  targetColor,
  resultColor,
  showDistance = true,
  showLabels = true,
  size = 'medium',
}: ColorComparisonProps) {
  const distance = calculateColorDistanceFull(targetColor, resultColor)
  const isExactMatch = distance < 5

  return (
    <div className={`color-comparison color-comparison--${size}`}>
      <div className="color-comparison__colors">
        <div className="color-comparison__item">
          {showLabels && (
            <h3 className="color-comparison__label">Целевой цвет</h3>
          )}
          <ColorPreview
            color={targetColor}
            size={size}
            showHex
            showRgb
            label={showLabels ? undefined : 'Целевой'}
          />
        </div>
        <div className="color-comparison__arrow">→</div>
        <div className="color-comparison__item">
          {showLabels && (
            <h3 className="color-comparison__label">Результирующий цвет</h3>
          )}
          <ColorPreview
            color={resultColor}
            size={size}
            showHex
            showRgb
            label={showLabels ? undefined : 'Результат'}
          />
        </div>
      </div>
      {showDistance && (
        <div className="color-comparison__distance">
          <span
            className={`color-comparison__distance-value ${
              isExactMatch
                ? 'color-comparison__distance-value--exact'
                : 'color-comparison__distance-value--close'
            }`}
          >
            {isExactMatch
              ? 'Точное совпадение'
              : `Расстояние: ${Math.round(distance)} единиц`}
          </span>
        </div>
      )}
    </div>
  )
}

export default ColorComparison

