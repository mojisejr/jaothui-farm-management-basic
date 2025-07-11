'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import ErrorBoundary from '@/components/ErrorBoundary'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors except 408, 429
              if (error instanceof Error) {
                // Check if error has a status property from fetch responses
                if ('status' in error) {
                  const status = (error as { status: number }).status
                  if (
                    status >= 400 &&
                    status < 500 &&
                    status !== 408 &&
                    status !== 429
                  ) {
                    return false
                  }
                }
                // Don't retry on network errors immediately - wait for backoff
                if (error.message.includes('fetch') || error.name === 'TypeError') {
                  return failureCount < 2 // Reduce retries for network errors
                }
              }
              return failureCount < 3
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  )

  return (
    <ErrorBoundary onError={(error, errorInfo) => {
      console.error('Root Error Boundary:', error, errorInfo)
      // In production, send to error reporting service
      if (process.env.NODE_ENV === 'production') {
        // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
      }
    }}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NotificationProvider>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'hsl(var(--b1))',
                    color: 'hsl(var(--bc))',
                    border: '1px solid hsl(var(--b3))',
                  },
                }}
              />
              {children}
              <ReactQueryDevtools initialIsOpen={false} />
            </NotificationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
