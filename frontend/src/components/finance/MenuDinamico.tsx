"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Users, 
  UserCheck, 
  RefreshCw, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  LogOut,
  Home
} from 'lucide-react'

interface MenuItem {
  id: string
  label: string
  href: string
  icon: React.ReactNode
  color: string
}

export default function MenuDinamico() {
  const [cargo, setCargo] = useState<string>('')
  const [userName, setUserName] = useState<string>('')

  useEffect(() => {
    const userCargo = localStorage.getItem('cargo') || ''
    const userData = localStorage.getItem('user')
    const user = userData ? JSON.parse(userData) : {}
    
    setCargo(userCargo)
    setUserName(user.nome || user.login || 'Usuário')
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('cargo')
    window.location.href = '/login'
  }

  // Menus baseados no cargo
  const getMenusByCargo = (): MenuItem[] => {
    const baseMenus: MenuItem[] = [
      {
        id: 'home',
        label: 'Dashboard',
        href: '/finance',
        icon: <Home className="w-5 h-5" />,
        color: 'bg-blue-500'
      }
    ]

    // Admin de Vendas - Acesso total
    if (cargo === 'admin' || cargo === 'admin_vendas') {
      return [
        ...baseMenus,
        {
          id: 'admin-vendas',
          label: 'Painel de Admin de Vendas',
          href: '/admin',
          icon: <BarChart3 className="w-5 h-5" />,
          color: 'bg-purple-500'
        },
        {
          id: 'vendedores',
          label: 'Gerenciar Vendedores',
          href: '/admin/vendedores',
          icon: <Users className="w-5 h-5" />,
          color: 'bg-green-500'
        },
        {
          id: 'recuperacao',
          label: 'Recuperação',
          href: '/vendedor/recuperacao',
          icon: <RefreshCw className="w-5 h-5" />,
          color: 'bg-orange-500'
        },
        {
          id: 'novos-clientes',
          label: 'Novos Clientes',
          href: '/vendedor/novos-clientes',
          icon: <UserCheck className="w-5 h-5" />,
          color: 'bg-emerald-500'
        },
        {
          id: 'vendas',
          label: 'Vendas',
          href: '/vendedor',
          icon: <ShoppingCart className="w-5 h-5" />,
          color: 'bg-indigo-500'
        },
        {
          id: 'configuracoes',
          label: 'Configurações',
          href: '/admin/configuracoes',
          icon: <Settings className="w-5 h-5" />,
          color: 'bg-gray-500'
        }
      ]
    }

    // Vendedor - Acesso limitado
    if (cargo === 'vendedor' || cargo === 'recuperacao') {
      return [
        ...baseMenus,
        {
          id: 'recuperacao',
          label: 'Recuperação',
          href: '/vendedor/recuperacao',
          icon: <RefreshCw className="w-5 h-5" />,
          color: 'bg-orange-500'
        },
        {
          id: 'novos-clientes',
          label: 'Novos Clientes',
          href: '/vendedor/novos-clientes',
          icon: <UserCheck className="w-5 h-5" />,
          color: 'bg-emerald-500'
        },
        {
          id: 'vendas',
          label: 'Minhas Vendas',
          href: '/vendedor',
          icon: <ShoppingCart className="w-5 h-5" />,
          color: 'bg-indigo-500'
        }
      ]
    }

    // Outros cargos - Menu básico
    return [
      ...baseMenus,
      {
        id: 'vendas',
        label: 'Vendas',
        href: '/vendedor',
        icon: <ShoppingCart className="w-5 h-5" />,
        color: 'bg-indigo-500'
      }
    ]
  }

  const menus = getMenusByCargo()

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      {/* Header do Menu */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Menu Principal</h2>
          <p className="text-sm text-gray-500">
            Bem-vindo, <span className="font-medium">{userName}</span>
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {cargo.toUpperCase()}
            </span>
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>

      {/* Grid de Menus */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menus.map((menu) => (
          <Link
            key={menu.id}
            href={menu.href}
            className="group block p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${menu.color} text-white`}>
                {menu.icon}
              </div>
              <div>
                <h3 className="font-medium text-gray-900 group-hover:text-gray-700">
                  {menu.label}
                </h3>
                <p className="text-sm text-gray-500">
                  Acessar {menu.label.toLowerCase()}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Informações do Cargo */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Permissões do Cargo</h4>
        <div className="text-sm text-gray-600">
          {cargo === 'admin' || cargo === 'admin_vendas' ? (
            <p>✅ Acesso total: Gerenciar vendedores, distribuir leads, visualizar estatísticas</p>
          ) : cargo === 'vendedor' || cargo === 'recuperacao' ? (
            <p>✅ Acesso limitado: Visualizar leads atribuídos, gerenciar recuperação e novos clientes</p>
          ) : (
            <p>✅ Acesso básico: Visualizar vendas e leads</p>
          )}
        </div>
      </div>
    </div>
  )
}
