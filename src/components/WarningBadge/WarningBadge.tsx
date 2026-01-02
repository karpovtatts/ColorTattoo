import type { Warning } from '@/types'
import './WarningBadge.css'

interface WarningBadgeProps {
  warning: Warning
  showIcon?: boolean
}

function WarningBadge({ warning, showIcon = true }: WarningBadgeProps) {
  const getIcon = () => {
    if (!showIcon) return null

    switch (warning.severity) {
      case 'high':
        return '⚠️'
      case 'medium':
        return '⚡'
      case 'low':
        return 'ℹ️'
      default:
        return '⚠️'
    }
  }

  return (
    <div
      className={`warning-badge warning-badge--${warning.severity}`}
    >
      {getIcon() && (
        <span className="warning-badge__icon">{getIcon()}</span>
      )}
      <p className="warning-badge__text">{warning.message}</p>
    </div>
  )
}

export default WarningBadge

