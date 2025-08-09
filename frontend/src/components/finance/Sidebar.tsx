"use client"

import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  LayoutDashboard, 
  CreditCard, 
  BarChart3, 
  Wallet, 
  History, 
  Settings, 
  Briefcase,
  Sun,
  Moon
} from 'lucide-react'

interface MenuItem {
  id: string
  label: string
  icon: React.ElementType
  active?: boolean
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, active: true },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'cards', label: 'Cards', icon: Wallet },
  { id: 'history', label: 'History', icon: History },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme()
  const [activeItem, setActiveItem] = useState('dashboard')

  return (
    <div className="w-64 h-screen bg-white dark:bg-[#1A1A1A] border-r border-gray-200 dark:border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold text-black">💰</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Finance</h1>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeItem === item.id
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveItem(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Theme Toggle */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-3">
            {theme === 'light' ? (
              <Sun size={20} className="text-yellow-500" />
            ) : (
              <Moon size={20} className="text-blue-400" />
            )}
            <span className="font-medium text-gray-900 dark:text-white">
              {theme === 'light' ? 'Light' : 'Dark'}
            </span>
          </div>
          <div className={`w-12 h-6 rounded-full p-1 transition-colors ${
            theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300'
          }`}>
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
              theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </div>
        </button>
      </div>
    </div>
  )
}
