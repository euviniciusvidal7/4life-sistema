"use client"

import { CreditCard, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

interface Card {
  id: string
  number: string
  holder: string
  expiry: string
  type: 'mastercard' | 'visa'
  gradient: string
}

const cards: Card[] = [
  {
    id: '1',
    number: '1234 5678 9012 XXXX',
    holder: 'João Silva',
    expiry: '12/26',
    type: 'mastercard',
    gradient: 'bg-gradient-to-br from-gray-900 to-gray-700'
  },
  {
    id: '2',
    number: '9876 5432 1098 XXXX',
    holder: 'João Silva',
    expiry: '08/27',
    type: 'visa',
    gradient: 'bg-gradient-to-br from-blue-600 to-purple-700'
  }
]

export default function CreditCards() {
  const [showNumbers, setShowNumbers] = useState<{[key: string]: boolean}>({})

  const toggleCardNumber = (cardId: string) => {
    setShowNumbers(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }))
  }

  const getCardNumber = (card: Card) => {
    return showNumbers[card.id] ? '1234 5678 9012 3456' : card.number
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Meus Cartões
        </h3>
        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          Ver todos
        </button>
      </div>

      <div className="grid gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`relative p-6 rounded-xl text-white ${card.gradient} overflow-hidden`}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white transform translate-x-16 -translate-y-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white transform -translate-x-12 translate-y-12" />
            </div>

            <div className="relative">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <CreditCard size={24} />
                  <span className="text-sm font-medium opacity-80">
                    {card.type === 'mastercard' ? 'Mastercard' : 'Visa'}
                  </span>
                </div>
                <button
                  onClick={() => toggleCardNumber(card.id)}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  {showNumbers[card.id] ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>

              {/* Card Number */}
              <div className="mb-6">
                <p className="text-xl font-mono tracking-wider">
                  {getCardNumber(card)}
                </p>
              </div>

              {/* Card Details */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-60 mb-1">Titular</p>
                  <p className="font-medium">{card.holder}</p>
                </div>
                <div>
                  <p className="text-xs opacity-60 mb-1">Validade</p>
                  <p className="font-medium">{card.expiry}</p>
                </div>
                <div className="w-12 h-8 bg-white/20 rounded flex items-center justify-center">
                  <span className="text-xs font-bold">
                    {card.type === 'mastercard' ? 'MC' : 'V'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Card */}
      <button className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 transition-colors group">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
            <CreditCard size={24} className="text-gray-400 group-hover:text-blue-500" />
          </div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            Adicionar Novo Cartão
          </span>
        </div>
      </button>
    </div>
  )
}
