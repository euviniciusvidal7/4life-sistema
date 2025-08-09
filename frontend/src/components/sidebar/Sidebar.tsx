"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Wallet,
  History,
  Briefcase,
  Settings,
  Users,
  UserCheck,
  RefreshCw,
  ShoppingCart,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react'
import NavItem from './NavItem'
import ThemeSwitch from './ThemeSwitch'

interface MenuItem {
  id: string
  label: string
  icon: any
  href: string
  group: string
}

interface MenuGroup {
  name: string
  items: MenuItem[]
}

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [cargo, setCargo] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const userCargo = localStorage.getItem('cargo') || ''
    const userData = localStorage.getItem('user')
    const user = userData ? JSON.parse(userData) : {}
    
    setCargo(userCargo)
    setUserName(user.nome || user.login || 'Usuário')
  }, [])

  // Detectar se é dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setCollapsed(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('cargo')
    window.location.href = '/login'
  }

  const handleMobileToggle = () => {
    setCollapsed(!collapsed)
  }

  // Definir menus baseados no cargo
  const getMenuGroups = (): MenuGroup[] => {
    const baseMenus: MenuItem[] = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/finance', group: 'Financeiro' },
    ]

    const adminMenus: MenuItem[] = [
      { id: 'recuperacao', label: 'Recuperação', icon: RefreshCw, href: '/vendedor/recuperacao', group: 'Administração' },
      { id: 'painel-vendas', label: 'Painel de Vendas', icon: BarChart3, href: '/admin', group: 'Administração' },
      { id: 'gerenciar-vendedores', label: 'Gerenciar Vendedores', icon: Users, href: '/admin/vendedores', group: 'Administração' },
      { id: 'novos-clientes', label: 'Novos Clientes', icon: UserCheck, href: '/vendedor/novos-clientes', group: 'Vendas' },
      { id: 'vendas', label: 'Vendas', icon: ShoppingCart, href: '/vendedor', group: 'Vendas' },
      { id: 'configuracoes', label: 'Configurações', icon: Settings, href: '/finance/configuracoes', group: 'Sistema' },
    ]

    const vendedorMenus: MenuItem[] = [
      { id: 'recuperacao', label: 'Recuperação', icon: RefreshCw, href: '/vendedor/recuperacao', group: 'Vendas' },
      { id: 'novos-clientes', label: 'Novos Clientes', icon: UserCheck, href: '/vendedor/novos-clientes', group: 'Vendas' },
      { id: 'vendas', label: 'Vendas', icon: ShoppingCart, href: '/vendedor', group: 'Vendas' },
      { id: 'configuracoes', label: 'Configurações', icon: Settings, href: '/finance/configuracoes', group: 'Sistema' },
    ]

    let allMenus = [...baseMenus]

    if (cargo === 'admin' || cargo === 'admin_vendas') {
      allMenus = [...allMenus, ...adminMenus]
    } else if (cargo === 'vendedor' || cargo === 'recuperacao') {
      allMenus = [...allMenus, ...vendedorMenus]
    } else {
      allMenus = [...allMenus, ...vendedorMenus]
    }

    // Agrupar menus
    const groups: { [key: string]: MenuItem[] } = {}
    allMenus.forEach(item => {
      if (!groups[item.group]) {
        groups[item.group] = []
      }
      groups[item.group].push(item)
    })

    return Object.entries(groups).map(([name, items]) => ({
      name,
      items
    }))
  }

  const menuGroups = getMenuGroups()

  const sidebarWidth = collapsed ? 'w-16' : 'w-64'
  const mobileClasses = isMobile && !collapsed ? 'w-64' : sidebarWidth

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && !collapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Mobile Toggle Button */}
      {isMobile && collapsed && (
        <button
          onClick={handleMobileToggle}
          className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg lg:hidden"
        >
          <Menu size={20} />
        </button>
      )}

      <div className={`${mobileClasses} h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col fixed left-0 top-0 z-40 transition-all duration-300 ${isMobile && collapsed ? '-translate-x-full' : ''}`}>
        {/* Header */}
        <div className="py-6 px-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center justify-center my-6">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F66a515898de74861afe27f7516f388a1%2F3ad023ab67684955b74c727c46de98a4?format=webp&width=800"
                  alt="4Life Nutrition"
                  className="h-16 w-auto object-contain"
                />
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {collapsed ? <ChevronRight size={16} /> : <X size={16} />}
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-6">
            {menuGroups.map((group) => (
              <div key={group.name}>
                {!collapsed && (
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
                    {group.name}
                  </h3>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <NavItem
                      key={item.id}
                      icon={item.icon}
                      label={item.label}
                      href={item.href}
                      isActive={pathname === item.href}
                      collapsed={collapsed}
                      onClick={() => {
                        setActiveItem(item.id)
                        router.push(item.href)
                        if (isMobile) {
                          setCollapsed(true)
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="p-4 space-y-4 border-t border-gray-100 dark:border-gray-700">
          {/* User Info */}
          {!collapsed && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {userName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {cargo === 'admin' || cargo === 'admin_vendas' ? 'Administrador 4Life' : cargo.toUpperCase()}
              </p>
            </div>
          )}

          {/* Theme Switch */}
          <ThemeSwitch collapsed={collapsed} />

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </div>
    </>
  )
}
