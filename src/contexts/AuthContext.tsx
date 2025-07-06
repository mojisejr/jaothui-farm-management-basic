'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import { AuthContextType, User } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Function to refresh authentication state
  const refreshAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error refreshing auth:', error)
      // Only set user to null if it's a network error or server error
      // Don't logout user for temporary network issues
      if (error instanceof TypeError || (error as Error)?.message?.includes('fetch')) {
        // Network error - keep user logged in
        console.warn('Network error during auth refresh, keeping user logged in')
      } else {
        setUser(null)
      }
    }
  }, [])

  // Function to login
  const login = useCallback(async (phone: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phone,
          password,
        }),
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        return {
          success: true,
          message: data.message || 'เข้าสู่ระบบสำเร็จ',
          user: data.user,
        }
      } else {
        return {
          success: false,
          message: data.error || 'เข้าสู่ระบบไม่สำเร็จ',
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด',
      }
    }
  }, [])

  // Function to logout
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setUser(null)
    }
  }, [])

  // Initialize authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true)
        await refreshAuth()
      } catch (error) {
        console.error('Error initializing auth:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [refreshAuth])

  // Auto-refresh tokens when they're about to expire
  useEffect(() => {
    if (!user) return

    // Set up token refresh interval (refresh every 23 hours)
    const refreshInterval = setInterval(
      () => {
        refreshAuth()
      },
      23 * 60 * 60 * 1000,
    ) // 23 hours

    return () => clearInterval(refreshInterval)
  }, [user, refreshAuth])

  const value = {
    user,
    loading,
    login,
    logout,
    refreshAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
