'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearAll: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])

    // Auto remove after duration
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const getToastStyles = (type: ToastType) => {
    const styles = {
      success: {
        backgroundColor: 'var(--success-background)',
        borderColor: 'var(--success-border)',
        iconColor: 'var(--success-color)',
        icon: CheckCircle
      },
      error: {
        backgroundColor: 'var(--error-background)',
        borderColor: 'var(--error-border)',
        iconColor: 'var(--error-color)',
        icon: AlertCircle
      },
      warning: {
        backgroundColor: 'var(--warning-background)',
        borderColor: 'var(--warning-border)',
        iconColor: 'var(--warning-color)',
        icon: AlertTriangle
      },
      info: {
        backgroundColor: 'var(--info-background)',
        borderColor: 'var(--info-border)',
        iconColor: 'var(--info-color)',
        icon: Info
      }
    }
    return styles[type]
  }

  const styles = getToastStyles(toast.type)
  const Icon = styles.icon

  return (
    <div
      className="pointer-events-auto relative animate-toast-slide-in"
      style={{
        backgroundColor: styles.backgroundColor,
        border: `1px solid ${styles.borderColor}`,
        borderRadius: 'var(--mat-card-elevated-container-shape)',
        boxShadow: 'var(--elevation-level-3)',
        backdropFilter: 'blur(8px)',
        padding: '16px',
        width: '100%'
      }}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <Icon 
            className="w-5 h-5" 
            style={{ color: styles.iconColor }}
            aria-hidden="true"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 
            className="font-medium mb-1"
            style={{
              fontSize: 'var(--sys-title-medium-size)',
              lineHeight: 'var(--sys-title-medium-line-height)',
              fontFamily: 'var(--sys-title-medium-font)',
              fontWeight: 'var(--sys-title-medium-weight)',
              color: 'var(--text-primary)'
            }}
          >
            {toast.title}
          </h4>
          
          {toast.description && (
            <p 
              style={{
                fontSize: 'var(--sys-body-medium-size)',
                lineHeight: 'var(--sys-body-medium-line-height)',
                fontFamily: 'var(--sys-body-medium-font)',
                fontWeight: 'var(--sys-body-medium-weight)',
                color: 'var(--text-secondary)',
                marginBottom: toast.action ? '12px' : '0'
              }}
            >
              {toast.description}
            </p>
          )}

          {/* Action Button */}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 focus-indicator"
              style={{
                backgroundColor: 'transparent',
                color: styles.iconColor,
                border: `1px solid ${styles.iconColor}`,
                borderRadius: 'var(--mat-button-outlined-container-shape)',
                padding: '6px 12px',
                fontSize: 'var(--sys-label-medium-size)',
                lineHeight: 'var(--sys-label-medium-line-height)',
                fontFamily: 'var(--sys-label-medium-font)',
                fontWeight: 'var(--sys-label-medium-weight)',
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.2, 0, 0, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = styles.iconColor
                e.currentTarget.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = styles.iconColor
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 p-1 focus-indicator"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: 'var(--shape-corner-small)',
            color: 'var(--text-disabled)',
            cursor: 'pointer',
            transition: 'all 200ms cubic-bezier(0.2, 0, 0, 1)'
          }}
          aria-label="Close notification"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--state-hover)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--text-disabled)'
          }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Convenience hooks for different toast types
export function useSuccessToast() {
  const { addToast } = useToast()
  return useCallback((title: string, description?: string, action?: Toast['action']) => {
    addToast({ type: 'success', title, description, action })
  }, [addToast])
}

export function useErrorToast() {
  const { addToast } = useToast()
  return useCallback((title: string, description?: string, action?: Toast['action']) => {
    addToast({ type: 'error', title, description, action })
  }, [addToast])
}

export function useWarningToast() {
  const { addToast } = useToast()
  return useCallback((title: string, description?: string, action?: Toast['action']) => {
    addToast({ type: 'warning', title, description, action })
  }, [addToast])
}

export function useInfoToast() {
  const { addToast } = useToast()
  return useCallback((title: string, description?: string, action?: Toast['action']) => {
    addToast({ type: 'info', title, description, action })
  }, [addToast])
}