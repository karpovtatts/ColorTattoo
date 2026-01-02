import { useEffect } from 'react'
import './Toast.css'

export interface ToastProps {
  id: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose: (id: string) => void
}

function Toast({ id, message, type = 'info', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [id, duration, onClose])

  return (
    <div className={`toast toast--${type}`} role="alert">
      <div className="toast__content">
        <span className="toast__icon">{getIcon(type)}</span>
        <p className="toast__message">{message}</p>
      </div>
      <button
        className="toast__close"
        onClick={() => onClose(id)}
        aria-label="Закрыть"
      >
        ×
      </button>
    </div>
  )
}

function getIcon(type: string): string {
  switch (type) {
    case 'success':
      return '✓'
    case 'error':
      return '✕'
    case 'warning':
      return '⚠'
    case 'info':
    default:
      return 'ℹ'
  }
}

export default Toast

