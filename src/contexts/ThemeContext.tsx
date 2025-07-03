'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme =
  | 'jaothui'
  | 'light'
  | 'dark'
  | 'cupcake'
  | 'bumblebee'
  | 'emerald'
  | 'corporate'
  | 'retro'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  availableThemes: Theme[]
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'jaothui-theme'
const DEFAULT_THEME: Theme = 'jaothui'

const AVAILABLE_THEMES: Theme[] = [
  'jaothui',
  'light',
  'dark',
  'cupcake',
  'bumblebee',
  'emerald',
  'corporate',
  'retro',
]

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof document !== 'undefined') {
      const attr = document.documentElement.getAttribute(
        'data-theme',
      ) as Theme | null
      if (attr && AVAILABLE_THEMES.includes(attr)) return attr
    }
    return DEFAULT_THEME
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme
    if (savedTheme && AVAILABLE_THEMES.includes(savedTheme)) {
      setThemeState(savedTheme)
    }
    setIsLoaded(true)
  }, [])

  // Apply theme to HTML element
  useEffect(() => {
    if (isLoaded) {
      document.documentElement.setAttribute('data-theme', theme)
    }
  }, [theme, isLoaded])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  // Don't render children until theme is loaded to prevent flash
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        availableThemes: AVAILABLE_THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Theme selection component for easy integration
export function ThemeSelector({ className = '' }: { className?: string }) {
  const { theme, setTheme, availableThemes } = useTheme()

  const themeLabels: Record<Theme, string> = {
    jaothui: 'Jaothui (ทอง)',
    light: 'Light (สว่าง)',
    dark: 'Dark (มืด)',
    cupcake: 'Cupcake (หวาน)',
    bumblebee: 'Bumblebee (ผึ้ง)',
    emerald: 'Emerald (เขียว)',
    corporate: 'Corporate (อย่างเป็นทางการ)',
    retro: 'Retro (คลาสสิก)',
  }

  return (
    <div className={`dropdown dropdown-end ${className}`}>
      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm gap-2">
        <div className="w-4 h-4 rounded-full bg-primary"></div>
        <span className="hidden sm:inline">{themeLabels[theme]}</span>
        <svg
          width="12px"
          height="12px"
          className="ml-1 hidden h-3 w-3 fill-current opacity-60 sm:inline-block"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 2048 2048"
        >
          <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
        </svg>
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-200 rounded-box z-[1] w-52 p-2 shadow-2xl"
      >
        {availableThemes.map((themeName) => (
          <li key={themeName}>
            <button
              className={`flex items-center gap-2 ${
                theme === themeName ? 'active' : ''
              }`}
              onClick={() => setTheme(themeName)}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  backgroundColor:
                    themeName === 'jaothui'
                      ? '#D4AF37'
                      : themeName === 'light'
                        ? '#570df8'
                        : themeName === 'dark'
                          ? '#661ae6'
                          : themeName === 'cupcake'
                            ? '#65c3c8'
                            : themeName === 'bumblebee'
                              ? '#e9c46a'
                              : themeName === 'emerald'
                                ? '#66cc8a'
                                : themeName === 'corporate'
                                  ? '#4b6bfb'
                                  : '#f28c18',
                }}
              ></div>
              <span>{themeLabels[themeName]}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
