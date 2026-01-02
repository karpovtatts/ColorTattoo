import type { Color } from '@/types'
import { analyzeColorTemperature } from '@/services/colorAnalysis'
import './TemperatureIndicator.css'

interface TemperatureIndicatorProps {
  color: Color
  size?: 'small' | 'medium' | 'large'
}

function TemperatureIndicator({ color, size = 'medium' }: TemperatureIndicatorProps) {
  const analysis = analyzeColorTemperature(color)

  const getIcon = () => {
    if (analysis.isNeutral) {
      return '⚪'
    } else if (analysis.isWarm) {
      return '🔥'
    } else {
      return '❄️'
    }
  }

  const getLabel = () => {
    if (analysis.isNeutral) {
      return 'Нейтральный'
    } else if (analysis.isWarm) {
      return 'Теплый'
    } else {
      return 'Холодный'
    }
  }

  return (
    <div className={`temperature-indicator temperature-indicator--${size}`}>
      <div
        className={`temperature-indicator__content temperature-indicator__content--${
          analysis.isWarm ? 'warm' : analysis.isCool ? 'cool' : 'neutral'
        }`}
      >
        <span className="temperature-indicator__icon">{getIcon()}</span>
        <span className="temperature-indicator__label">{getLabel()}</span>
      </div>
      {!analysis.isNeutral && analysis.temperature !== 0 && (
        <div className="temperature-indicator__scale">
          <div className="temperature-indicator__scale-track">
            <div
              className="temperature-indicator__scale-marker"
              style={{
                left: analysis.isWarm
                  ? `${50 + (Math.abs(analysis.temperature) * 50)}%`
                  : `${50 - (Math.abs(analysis.temperature) * 50)}%`,
                backgroundColor: analysis.isWarm ? '#f59e0b' : '#3b82f6',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default TemperatureIndicator

