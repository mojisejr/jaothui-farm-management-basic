'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to the console and potentially to an error reporting service
    console.error('Global error:', error)
    
    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error)
    }
  }, [error])

  return (
    <html lang="th" data-theme="jaothui">
      <body>
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body text-center">
                <div className="flex justify-center mb-4">
                  <AlertTriangle className="w-16 h-16 text-error" />
                </div>
                
                <h1 className="card-title justify-center text-xl mb-2">
                  เกิดข้อผิดพลาดร้ายแรง
                </h1>
                
                <p className="text-base-content/70 mb-4">
                  ขออภัย เกิดข้อผิดพลาดที่ไม่คาดคิดขึ้น ระบบไม่สามารถทำงานได้ปกติ
                </p>

                {process.env.NODE_ENV === 'development' && (
                  <div className="alert alert-error text-left mb-4">
                    <div className="w-full">
                      <h4 className="font-semibold text-sm mb-2">รายละเอียดข้อผิดพลาด (Development):</h4>
                      <pre className="text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                        {error.message}
                        {error.digest && `\nDigest: ${error.digest}`}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="card-actions justify-center space-y-2 w-full">
                  <button 
                    onClick={reset}
                    className="btn btn-primary w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    ลองใหม่
                  </button>
                  
                  <button 
                    onClick={() => window.location.href = '/'}
                    className="btn btn-secondary w-full"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    กลับหน้าแรก
                  </button>
                  
                  <button 
                    onClick={() => window.location.reload()}
                    className="btn btn-ghost w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    รีเฟรชหน้า
                  </button>
                </div>

                <div className="mt-4 text-xs text-base-content/50">
                  หากปัญหายังคงเกิดขึ้น กรุณาติดต่อทีมพัฒนา
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}