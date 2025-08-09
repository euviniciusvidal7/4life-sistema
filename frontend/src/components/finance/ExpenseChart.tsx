"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { MoreHorizontal } from 'lucide-react'

const chartData = [
  { month: 'Jan', value: 25000 },
  { month: 'Fev', value: 30000 },
  { month: 'Mar', value: 28000 },
  { month: 'Abr', value: 35000 },
  { month: 'Mai', value: 32000 },
  { month: 'Jun', value: 34742 },
  { month: 'Jul', value: 38000 },
  { month: 'Ago', value: 42000 },
  { month: 'Set', value: 39000 },
  { month: 'Out', value: 45000 },
  { month: 'Nov', value: 43000 },
  { month: 'Dez', value: 47000 }
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </p>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Gastos: ${payload[0].value.toLocaleString()}
        </p>
      </div>
    )
  }
  return null
}

export default function ExpenseChart() {
  const currentValue = chartData[chartData.length - 2].value // November value

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Gastos Mensais
          </h3>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              ${currentValue.toLocaleString()}.00
            </span>
            <span className="text-sm text-green-500 font-medium">
              +8.2% vs mês anterior
            </span>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <MoreHorizontal size={20} className="text-gray-500" />
        </button>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          Período: Jan - Dez 2024
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          Último mês destacado
        </span>
      </div>
    </div>
  )
}
