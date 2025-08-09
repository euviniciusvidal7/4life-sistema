"use client"

import { TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react'

interface Investment {
  id: string
  name: string
  symbol: string
  value: number
  change: number
  changePercent: number
  color: string
}

const investments: Investment[] = [
  {
    id: '1',
    name: 'Bitcoin',
    symbol: 'BTC',
    value: 43250,
    change: 1230,
    changePercent: 2.93,
    color: 'bg-orange-500'
  },
  {
    id: '2',
    name: 'Ethereum',
    symbol: 'ETH',
    value: 2650,
    change: -45,
    changePercent: -1.67,
    color: 'bg-blue-500'
  },
  {
    id: '3',
    name: 'Apple',
    symbol: 'AAPL',
    value: 175.50,
    change: 2.30,
    changePercent: 1.33,
    color: 'bg-gray-500'
  },
  {
    id: '4',
    name: 'Tesla',
    symbol: 'TSLA',
    value: 242.80,
    change: -8.20,
    changePercent: -3.27,
    color: 'bg-red-500'
  }
]

export default function Investments() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Investimentos
        </h3>
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <MoreHorizontal size={20} className="text-gray-500" />
        </button>
      </div>

      <div className="space-y-4">
        {investments.map((investment) => {
          const isPositive = investment.change >= 0
          
          return (
            <div
              key={investment.id}
              className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full ${investment.color} flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">
                    {investment.symbol.substring(0, 2)}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {investment.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {investment.symbol}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-white">
                  ${investment.value.toLocaleString()}
                </p>
                <div className={`flex items-center space-x-1 text-sm ${
                  isPositive ? 'text-green-500' : 'text-red-500'
                }`}>
                  {isPositive ? (
                    <TrendingUp size={14} />
                  ) : (
                    <TrendingDown size={14} />
                  )}
                  <span>
                    {isPositive ? '+' : ''}${Math.abs(investment.change).toFixed(2)}
                  </span>
                  <span>
                    ({isPositive ? '+' : ''}{investment.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button className="w-full mt-6 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
        Ver Todos os Investimentos
      </button>
    </div>
  )
}
