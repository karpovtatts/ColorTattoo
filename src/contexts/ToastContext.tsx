import { createContext, useContext, ReactNode } from 'react'
import { useToast } from '@/hooks/useToast'
import type { ToastData } from '@/components/Toast/ToastContainer'

interface ToastContextType {
  toasts: ToastData[]
  showToast: (message: string, type?: ToastData['type'], duration?: number) => string
  removeToast: (id: string) => void
  success: (message: string, duration?: number) => string
  error: (message: string, duration?: number) => string
  warning: (message: string, duration?: number) => string
  info: (message: string, duration?: number) => string
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useToast()

  return <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}

