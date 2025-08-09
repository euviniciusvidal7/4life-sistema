"use client"
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const menuItems = [
  {
    title: 'Dashboard',
    icon: '📊',
    href: '/vendedor',
    admin: false
  },
  { title: 'Recuperação', icon: '♻️', href: '/vendedor/recuperacao', admin: false },
  { title: 'Novos Clientes', icon: '🟢', href: '/vendedor/novos-clientes', admin: false },
  {
    title: 'Lixeira',
    icon: '🗑️',
    href: '/vendedor/lixeira',
    admin: false
  },
  {
    title: 'Admin de Vendas',
    icon: '🛠️',
    href: '/admin',
    admin: true
  },
  {
    title: 'Distribuição',
    icon: '📬',
    href: '/admin/distribuicao',
    admin: true
  },
  {
    title: 'Vendedores',
    icon: '👨‍💼',
    href: '/admin/vendedores',
    admin: true
  },
  {
    title: 'Configurações',
    icon: '⚙️',
    href: '/admin/configuracoes',
    admin: true
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const isAdmin = user?.nivel_acesso === 'admin' || user?.nivel_acesso === 'admin_vendas'

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const u = JSON.parse(localStorage.getItem('user') || 'null')
        setUser(u)
      } catch {}
    }
  }, [])

  return (
    <aside className="w-64 bg-white h-screen shadow-lg fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">4Life</h1>
        <p className="text-sm text-gray-500">Sistema de Leads</p>
      </div>

      <nav className="mt-6">
        {menuItems
          .filter(item => !item.admin || isAdmin)
          .map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 ${
                pathname === item.href ? 'bg-gray-100' : ''
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.title}
            </Link>
          ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            {user?.nome?.[0] || '?'}
          </div>
          <div>
            <p className="font-medium text-gray-900">{user?.nome || 'Usuário'}</p>
            <p className="text-sm text-gray-500">{user?.nivel_acesso || 'Carregando...'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
