import './LoadingSpinner.css'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  text?: string
  fullScreen?: boolean
}

function LoadingSpinner({ size = 'medium', text, fullScreen = false }: LoadingSpinnerProps) {
  const spinnerClass = `loading-spinner loading-spinner--${size}`
  const containerClass = fullScreen
    ? 'loading-spinner-container loading-spinner-container--fullscreen'
    : 'loading-spinner-container'

  return (
    <div className={containerClass}>
      <div className={spinnerClass}>
        <div className="loading-spinner__circle"></div>
        <div className="loading-spinner__circle"></div>
        <div className="loading-spinner__circle"></div>
      </div>
      {text && <p className="loading-spinner__text">{text}</p>}
    </div>
  )
}

export default LoadingSpinner

