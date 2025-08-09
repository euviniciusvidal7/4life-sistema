"use client"

import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface ThemeSwitchProps {
  collapsed?: boolean
}

export default function ThemeSwitch({ collapsed = false }: ThemeSwitchProps) {
  const { theme, toggleTheme, mounted } = useTheme()

  // Se não está montado, mostrar loading
  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div className="animate-pulse">
          <div className="w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
      </div>
    )
  }

  if (collapsed) {
    return (
      <button
        onClick={toggleTheme}
        className="w-full flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      >
        {theme === 'dark' ? (
          <Moon size={20} className="text-gray-600" />
        ) : (
          <Sun size={20} className="text-yellow-500" />
        )}
      </button>
    )
  }

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
      <div className="flex items-center space-x-3">
        {theme === 'dark' ? (
          <Moon size={20} className="text-gray-600" />
        ) : (
          <Sun size={20} className="text-yellow-500" />
        )}
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {theme === 'dark' ? 'Dark' : 'Light'}
        </span>
      </div>
      
      <button
        onClick={toggleTheme}
        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-yellow-200'
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${
            theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
