'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

interface ToastProps {
  id: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose: (id: string) => void
}

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type = 'info',
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger fade in
    const timer1 = setTimeout(() => setIsVisible(true), 100)
    
    // Auto close
    const timer2 = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(id), 300)
    }, duration)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [id, duration, onClose])

  const config = {
    success: {
      icon: CheckCircle,
      className: 'bg-green-50 border-green-200 text-green-800'
    },
    error: {
      icon: XCircle,
      className: 'bg-red-50 border-red-200 text-red-800'
    },
    warning: {
      icon: AlertCircle,
      className: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    },
    info: {
      icon: Info,
      className: 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const { icon: Icon, className } = config[type]

  return (
    <div
      className={`
        flex items-center gap-3 p-4 rounded-lg border shadow-lg transition-all duration-300 transform
        ${className}
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <Icon size={20} />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(() => onClose(id), 300)
        }}
        className="p-0.5 hover:bg-white hover:bg-opacity-50 rounded transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )
}

// Toast container component
interface ToastContainerProps {
  toasts: Array<{
    id: string
    message: string
    type?: 'success' | 'error' | 'warning' | 'info'
  }>
  onRemove: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={onRemove}
        />
      ))}
    </div>
  )
}

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<Array<{
    id: string
    message: string
    type?: 'success' | 'error' | 'warning' | 'info'
  }>>([])

  const addToast = (message: string, type?: 'success' | 'error' | 'warning' | 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return {
    toasts,
    addToast,
    removeToast
  }
}