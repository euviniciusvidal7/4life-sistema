"use client"

import { Crown, TrendingUp, Gift, DollarSign } from 'lucide-react'

interface QuickAction {
  id: string
  title: string
  subtitle: string
  icon: React.ElementType
  color: string
  bgColor: string
}

const actions: QuickAction[] = [
  {
    id: 'pro',
    title: 'Torne-se Pro',
    subtitle: 'Version',
    icon: Crown,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
  },
  {
    id: 'profits',
    title: 'Maximizar',
    subtitle: 'Lucros',
    icon: TrendingUp,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20'
  },
  {
    id: 'deals',
    title: 'Melhores Ofertas',
    subtitle: 'do Mês',
    icon: Gift,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20'
  },
  {
    id: 'profit',
    title: 'Lucro',
    subtitle: 'do Mês',
    icon: DollarSign,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20'
  }
]

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {actions.map((action) => {
        const Icon = action.icon
        
        return (
          <button
            key={action.id}
            className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:scale-105 group"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className={`w-12 h-12 rounded-full ${action.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon size={24} className={action.color} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {action.subtitle}
                </p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
