"use client"

import Sidebar from '@/components/sidebar/Sidebar'

export default function SidebarDemo() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="ml-[250px] p-8">
        <div className="max-w-4xl">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Dashboard Financeiro
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Sample Cards */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Receita Total
              </h3>
              <p className="text-3xl font-bold text-green-600">
                R$ 125.430
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                +12% vs mês anterior
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Despesas
              </h3>
              <p className="text-3xl font-bold text-red-600">
                R$ 87.250
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                +5% vs mês anterior
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Lucro Líquido
              </h3>
              <p className="text-3xl font-bold text-blue-600">
                R$ 38.180
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                +18% vs mês anterior
              </p>
            </div>
          </div>
          
          <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Demonstração da Sidebar
            </h3>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                ✅ <strong>Cabeçalho:</strong> Ícone redondo com símbolo de moeda + título "Finance"
              </p>
              <p>
                ✅ <strong>Menu de Navegação:</strong> 7 itens verticais com ícones (Dashboard ativo em amarelo)
              </p>
              <p>
                ✅ <strong>Card de Anúncio:</strong> "Trade smarter with Finance AI" com botão "Upgrade to Pro"
              </p>
              <p>
                ✅ <strong>Switch de Tema:</strong> Alternância Light/Dark na parte inferior
              </p>
              <p>
                ✅ <strong>Estilo:</strong> Largura fixa ~250px, fundo branco, tipografia moderna
              </p>
              <p>
                ✅ <strong>Estrutura Modular:</strong> Componentes separados (Sidebar, NavItem, ThemeSwitch)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
