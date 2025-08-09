"use client"

import { useState } from 'react'
import { ChevronDown, Bell, Search, Calendar } from 'lucide-react'

export default function Header() {
  const [selectedDate, setSelectedDate] = useState('1 Nov - 1 Dec, 2024')

  return (
    <div className="bg-white dark:bg-[#1A1A1A] border-b border-gray-200 dark:border-gray-800 px-8 py-6">
      <div className="flex items-center justify-between">
        {/* User Info & Welcome */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-semibold">JD</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Olá, John Doe! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Bem-vindo de volta ao seu painel financeiro
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Date Selector */}
          <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg">
            <Calendar size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedDate}
            </span>
            <ChevronDown size={16} className="text-gray-500" />
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Bell size={20} className="text-gray-600 dark:text-gray-400" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </div>
  )
}
