'use client';

import React from 'react';
import FinanceLayout from '@/components/dashboard/FinanceLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LeadsDisponiveis from '@/components/dashboard/LeadsDisponiveis';
import StatsCard from '@/components/dashboard/StatsCard';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  ShoppingCart,
  UserCheck
} from 'lucide-react';

function SimpleCard({ title, subtitle, icon, children }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {(title || subtitle || icon) && (
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}

export default function FinancePage() {
  return (
    <ProtectedRoute>
      <FinanceLayout>
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Dashboard Financeiro
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-3 text-lg">
            Gerencie leads e monitore vendedores online
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total de Leads"
            value="1,234"
            change={12}
            changeLabel="vs mês anterior"
            icon={<Users className="w-8 h-8 text-blue-600" />}
            trend="up"
          />
          <StatsCard
            title="Vendas Realizadas"
            value="R$ 45.678"
            change={8}
            changeLabel="vs mês anterior"
            icon={<DollarSign className="w-8 h-8 text-green-600" />}
            trend="up"
          />
          <StatsCard
            title="Taxa de Conversão"
            value="23.4%"
            change={-2}
            changeLabel="vs mês anterior"
            icon={<TrendingUp className="w-8 h-8 text-orange-600" />}
            trend="down"
          />
          <StatsCard
            title="Vendedores Ativos"
            value="12"
            change={0}
            changeLabel="online agora"
            icon={<UserCheck className="w-8 h-8 text-purple-600" />}
            trend="neutral"
          />
        </div>

        {/* Main Content */}
        <div className="grid gap-6">
          <SimpleCard
            title="Leads Disponíveis"
            subtitle="Gerencie e distribua leads para vendedores"
            icon={<ShoppingCart className="w-6 h-6 text-blue-600" />}
          >
            <LeadsDisponiveis />
          </SimpleCard>
        </div>
      </FinanceLayout>
    </ProtectedRoute>
  );
}
