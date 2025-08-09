"use client"

import { ArrowUpRight, ArrowDownLeft, MoreHorizontal, Wallet, PiggyBank, CreditCard as CreditCardIcon } from 'lucide-react'

interface Transaction {
  id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  time: string
  icon: React.ElementType
}

const transactions: Transaction[] = [
  {
    id: '1',
    description: 'Salário Recebido',
    amount: 5200,
    type: 'income',
    category: 'Trabalho',
    time: '2h atrás',
    icon: Wallet
  },
  {
    id: '2',
    description: 'Compra Supermercado',
    amount: -280,
    type: 'expense',
    category: 'Alimentação',
    time: '5h atrás',
    icon: ArrowDownLeft
  },
  {
    id: '3',
    description: 'Investimento CDB',
    amount: -1000,
    type: 'expense',
    category: 'Investimento',
    time: '1 dia atrás',
    icon: PiggyBank
  },
  {
    id: '4',
    description: 'Freelance Projeto',
    amount: 800,
    type: 'income',
    category: 'Extra',
    time: '2 dias atrás',
    icon: ArrowUpRight
  },
  {
    id: '5',
    description: 'Conta de Luz',
    amount: -150,
    type: 'expense',
    category: 'Utilities',
    time: '3 dias atrás',
    icon: CreditCardIcon
  }
]

const balanceCategories = [
  { name: 'Conta Corrente', amount: 9385.34, color: 'bg-blue-500' },
  { name: 'Poupança', amount: 5200.00, color: 'bg-green-500' },
  { name: 'Investimentos', amount: 12450.00, color: 'bg-purple-500' },
  { name: 'Cartões', amount: -850.00, color: 'bg-red-500' }
]

export default function BalanceAndTransactions() {
  const totalBalance = balanceCategories.reduce((total, category) => total + category.amount, 0)

  return (
    <div className="space-y-6">
      {/* Total Balance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Saldo Total
          </h3>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <MoreHorizontal size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h2>
          <div className="flex items-center justify-center space-x-2">
            <ArrowUpRight size={16} className="text-green-500" />
            <span className="text-green-500 font-medium">+15.3%</span>
            <span className="text-gray-600 dark:text-gray-400">vs mês anterior</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {balanceCategories.map((category, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${category.color}`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {category.name}
                </span>
              </div>
              <span className={`text-sm font-semibold ${
                category.amount >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'
              }`}>
                R$ {Math.abs(category.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Transações Recentes
          </h3>
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Ver todas
          </button>
        </div>

        <div className="space-y-4">
          {transactions.map((transaction) => {
            const Icon = transaction.icon
            const isIncome = transaction.type === 'income'
            
            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isIncome 
                      ? 'bg-green-100 dark:bg-green-900/20' 
                      : 'bg-red-100 dark:bg-red-900/20'
                  }`}>
                    <Icon size={20} className={isIncome ? 'text-green-600' : 'text-red-600'} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {transaction.description}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {transaction.category} • {transaction.time}
                    </p>
                  </div>
                </div>
                
                <span className={`font-semibold ${
                  isIncome ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isIncome ? '+' : '-'}R$ {Math.abs(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )
          })}
        </div>

        <button className="w-full mt-6 p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors">
          Carregar Mais Transações
        </button>
      </div>
    </div>
  )
}
