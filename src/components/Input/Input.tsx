import { InputHTMLAttributes, forwardRef } from 'react'
import './Input.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  fullWidth?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = false, className = '', ...props }, ref) => {
    const classes = [
      'input',
      error && 'input--error',
      fullWidth && 'input--full-width',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={`input-wrapper ${fullWidth ? 'input-wrapper--full-width' : ''}`}>
        {label && (
          <label className="input__label" htmlFor={props.id}>
            {label}
          </label>
        )}
        <input ref={ref} className={classes} {...props} />
        {error && <span className="input__error">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input

