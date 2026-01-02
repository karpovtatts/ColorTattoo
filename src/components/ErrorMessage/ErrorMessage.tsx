import Button from '@/components/Button/Button'
import './ErrorMessage.css'

interface ErrorMessageProps {
  message: string
  title?: string
  onRetry?: () => void
  onDismiss?: () => void
  variant?: 'error' | 'warning' | 'info'
}

function ErrorMessage({
  message,
  title,
  onRetry,
  onDismiss,
  variant = 'error',
}: ErrorMessageProps) {
  return (
    <div className={`error-message error-message--${variant}`}>
      <div className="error-message__content">
        {title && <h3 className="error-message__title">{title}</h3>}
        <p className="error-message__text">{message}</p>
      </div>
      <div className="error-message__actions">
        {onRetry && (
          <Button variant="primary" size="sm" onClick={onRetry}>
            Повторить
          </Button>
        )}
        {onDismiss && (
          <Button variant="outline" size="sm" onClick={onDismiss}>
            Закрыть
          </Button>
        )}
      </div>
    </div>
  )
}

export default ErrorMessage

