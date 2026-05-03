import { type InputHTMLAttributes, forwardRef } from 'react'
import './Input.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  suffix?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, suffix, className = '', ...props }, ref) => {
    return (
      <div className={`input-wrapper ${className}`}>
        {label && <label className="input-label">{label}</label>}
        <div className="input-container">
          <input
            ref={ref}
            className={`input ${error ? 'input-error' : ''} ${suffix ? 'input-with-suffix' : ''}`}
            {...props}
          />
          {suffix && <span className="input-suffix">{suffix}</span>}
        </div>
        {error && <span className="input-error-text">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
