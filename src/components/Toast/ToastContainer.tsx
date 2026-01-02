import Toast, { type ToastProps } from './Toast'
import './ToastContainer.css'

export interface ToastData extends Omit<ToastProps, 'onClose'> {}

interface ToastContainerProps {
  toasts: ToastData[]
  onRemove: (id: string) => void
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onRemove} />
      ))}
    </div>
  )
}

export default ToastContainer

