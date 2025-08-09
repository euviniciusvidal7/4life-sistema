"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  RefreshCw,
  ShoppingCart,
  Settings,
  ChevronDown,
  ChevronRight,
  BarChart3,
  DollarSign,
  LogOut,
  Menu,
  X,
  Trash2,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuItem {
  id: string
  label: string
  icon: any
  href: string
  children?: MenuItem[]
}

interface MenuGroup {
  name: string
  items: MenuItem[]
}

export default function FinanceSidebar() {
  const [activeItem, setActiveItem] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [userName, setUserName] = useState<string>('')
  const [role, setRole] = useState<string>('vendedor')
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    const user = userData ? JSON.parse(userData) : {}
    setUserName(user.nome || user.nome_completo || user.login || 'Usuário')
    const cargo = localStorage.getItem('cargo') || user.nivel_acesso || 'vendedor'
    setRole(cargo)
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

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const isAdmin = role === 'admin' || role === 'admin_vendas'

  const getMenuGroups = (): MenuGroup[] => {
    if (!isAdmin) {
      // Vendedor: apenas suas páginas
      return [
        {
          name: 'Vendas',
          items: [
            {
              id: 'vendedor',
              label: 'Vendedor',
              icon: Users,
              href: '/vendedor',
              children: [
                { id: 'novos-clientes', label: 'Novos Clientes', icon: ShoppingCart, href: '/vendedor/novos-clientes' },
                { id: 'recuperacao', label: 'Recuperação', icon: RefreshCw, href: '/vendedor/recuperacao' },
                { id: 'novo-cliente', label: 'Novo Cliente', icon: CheckCircle2, href: '/vendedor/novo-cliente' },
                { id: 'lixeira', label: 'Lixeira', icon: Trash2, href: '/vendedor/lixeira' }
              ]
            }
          ]
        }
      ]
    }

    // Admin / Admin de Vendas: acesso total
    return [
      {
        name: 'Dashboard',
        items: [
          { id: 'dashboard', label: 'Dashboard Principal', icon: LayoutDashboard, href: '/dashboard' }
        ]
      },
      {
        name: 'Financeiro',
        items: [
          { id: 'finance', label: 'Financeiro', icon: DollarSign, href: '/finance' }
        ]
      },
      {
        name: 'Administração',
        items: [
          { id: 'admin', label: 'Admin', icon: BarChart3, href: '/admin' }
        ]
      },
      {
        name: 'Vendas',
        items: [
          {
            id: 'vendedor',
            label: 'Vendedor',
            icon: Users,
            href: '/vendedor',
            children: [
              { id: 'novos-clientes', label: 'Novos Clientes', icon: ShoppingCart, href: '/vendedor/novos-clientes' },
              { id: 'recuperacao', label: 'Recuperação', icon: RefreshCw, href: '/vendedor/recuperacao' },
              { id: 'novo-cliente', label: 'Novo Cliente', icon: CheckCircle2, href: '/vendedor/novo-cliente' },
              { id: 'lixeira', label: 'Lixeira', icon: Trash2, href: '/vendedor/lixeira' }
            ]
          }
        ]
      }
    ]
  }

  const menuGroups = getMenuGroups()

  const sidebarWidth = collapsed ? 'w-16' : 'w-64'
  const mobileClasses = isMobile && !collapsed ? 'w-64' : sidebarWidth

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isActive = pathname === item.href
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.id)
    const isActiveParent = hasChildren && item.children?.some(child => pathname === child.href)

    return (
      <div key={item.id}>
        <Link
          href={item.href}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
            'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20',
            isActive && 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg',
            isActiveParent && 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-800/30 dark:to-indigo-800/30',
            level > 0 && 'ml-4'
          )}
          onClick={() => {
            setActiveItem(item.id)
            if (isMobile) setCollapsed(true)
          }}
        >
          {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />}
          <item.icon className={cn('w-4 h-4 transition-transform duration-200', isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400')} />
          {!collapsed && (
            <>
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              {hasChildren && (
                <button
                  onClick={(e) => { e.preventDefault(); toggleExpanded(item.id) }}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
              )}
            </>
          )}
        </Link>

        {hasChildren && !collapsed && (
          <div className={cn('overflow-hidden transition-all duration-300', isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0')}>
            <div className="ml-4 mt-1 space-y-1">
              {item.children?.map(child => renderMenuItem(child, level + 1))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {isMobile && !collapsed && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden" onClick={() => setCollapsed(true)} />
      )}

      {isMobile && collapsed && (
        <button onClick={handleMobileToggle} className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 lg:hidden">
          <Menu size={20} />
        </button>
      )}

      <div className={cn('h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col fixed left-0 top-0 z-40 transition-all duration-300', mobileClasses, isMobile && collapsed && '-translate-x-full')}>
        <div className="py-6 px-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center justify-center my-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">4Life</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sistema</p>
                  </div>
                </div>
              </div>
            )}
            <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              {collapsed ? <ChevronRight size={16} /> : <X size={16} />}
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-6">
            {menuGroups.map((group) => (
              <div key={group.name}>
                {!collapsed && (
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">{group.name}</h3>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => renderMenuItem(item))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="p-4 space-y-4 border-t border-gray-100 dark:border-gray-700">
          {!collapsed && (
            <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{role}</p>
            </div>
          )}
          <button onClick={handleLogout} className={cn('w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors', collapsed && 'justify-center')}>
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </div>
    </>
  )
} 