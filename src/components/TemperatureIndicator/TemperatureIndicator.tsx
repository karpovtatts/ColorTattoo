import type { Color } from '@/types'
import { analyzeColorTemperature } from '@/services/colorAnalysis'
import './TemperatureIndicator.css'

interface TemperatureIndicatorProps {
  color: Color
  size?: 'small' | 'medium' | 'large'
}

function TemperatureIndicator({ color, size = 'medium' }: TemperatureIndicatorProps) {
  const analysis = analyzeColorTemperature(color)

  // 0% = полностью холодный, 50% = нейтральный, 100% = полностью тёплый
  const rawPosition = analysis.isNeutral
    ? 50
    : ((analysis.temperature + 1) / 2) * 100
  const position = Math.max(3, Math.min(97, rawPosition))

  const getLabel = () => {
    if (analysis.isNeutral) return 'Нейтральный'
    if (analysis.isWarm) return 'Тёплый'
    return 'Холодный'
  }

  const markerColor = analysis.isNeutral
    ? '#9ca3af'
    : analysis.isWarm
    ? '#f59e0b'
    : '#3b82f6'

  return (
    <div className={`temperature-indicator temperature-indicator--${size}`}>
      <div className="temperature-indicator__scale">
        <div className="temperature-indicator__scale-track">
          <div
            className="temperature-indicator__scale-marker"
            style={{ left: `${position}%`, '--marker-color': markerColor } as React.CSSProperties}
          >
            <span className="temperature-indicator__scale-marker-label">
              {getLabel()}
            </span>
          </div>
        </div>
        <div className="temperature-indicator__scale-ends">
          <span className="temperature-indicator__scale-end temperature-indicator__scale-end--cool">❄️ Холодный</span>
          <span className="temperature-indicator__scale-end temperature-indicator__scale-end--warm">Тёплый 🔥</span>
        </div>
      </div>
    </div>
  )
}

export default TemperatureIndicator
