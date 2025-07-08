'use client'

import React, { Component, ReactNode } from 'react'
import { RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error)
      console.error('Error info:', errorInfo)
    }

    // In production, you might want to send to error reporting service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/'
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="card w-full max-w-md bg-base-100 shadow-xl">
            <div className="card-body text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="w-16 h-16 text-error" />
              </div>

              <h2 className="card-title justify-center text-error mb-2">
                เกิดข้อผิดพลาด
              </h2>

              <p className="text-base-content/70 mb-6">
                ขออภัย เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง
                หากปัญหายังคงอยู่ กรุณาติดต่อทีมพัฒนา
              </p>

              {/* Error details in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="collapse collapse-arrow bg-base-200 mb-4">
                  <input type="checkbox" />
                  <div className="collapse-title text-sm font-medium">
                    รายละเอียดข้อผิดพลาด (Development)
                  </div>
                  <div className="collapse-content">
                    <pre className="text-xs text-left overflow-auto max-h-40 bg-base-300 p-2 rounded">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </div>
              )}

              <div className="card-actions justify-center gap-2 flex-col">
                <button className="btn btn-primary w-full" onClick={this.handleRetry}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  ลองใหม่
                </button>

                <button
                  type="button"
                  className="btn btn-outline w-full"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  รีเฟรชหน้า
                </button>

                <button
                  type="button"
                  className="btn btn-ghost w-full text-black"
                  onClick={this.handleGoBack}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  กลับหน้าก่อนหน้า
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

// Hook version for functional components
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, errorInfo?: unknown) => {
    console.error('Error caught by error handler:', error)

    if (errorInfo) {
      console.error('Error info:', errorInfo)
    }

    // In production, send to error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo })
  }, [])

  return handleError
}

// Wrapper component for query errors
interface QueryErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

export const QueryErrorBoundary: React.FC<QueryErrorBoundaryProps> = ({
  children,
  fallback,
}) => {
  return (
    <ErrorBoundary
      fallback={
        fallback ? (
          <div className="p-4">
            {/* This will be handled by the fallback prop if needed */}
          </div>
        ) : undefined
      }
      onError={(error, errorInfo) => {
        console.error('Query Error Boundary:', error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
