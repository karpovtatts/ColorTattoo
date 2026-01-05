import type { Color } from '@/types'
import { ColorPreview } from '@/components'
import { calculateColorDistancePerceptualFull } from '@/utils/colorMetric'
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
  const distance = calculateColorDistancePerceptualFull(targetColor, resultColor)
  const isExactMatch = distance < 2 // DeltaE < 2 считается неразличимым для глаза

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
              : `DeltaE: ${distance.toFixed(2)}`}
          </span>
        </div>
      )}
    </div>
  )
}

export default ColorComparison

