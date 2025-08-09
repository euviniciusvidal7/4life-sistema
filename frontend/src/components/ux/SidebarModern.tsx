"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Users, Settings, Activity, FolderCog, ListChecks, Truck } from 'lucide-react'
import Logo from './Logo'
import { useSidebar } from './SidebarContext'

const items = [
  { label: 'Visão Geral', href: '/admin/overview', icon: Home },
  { label: 'Leads', href: '/admin', icon: Activity },
  { label: 'Distribuição', href: '/admin', icon: ListChecks },
  { label: 'Vendedores', href: '/admin', icon: Users },
  { label: 'Serviços', href: '/admin', icon: Settings },
  { label: 'FileWatcher', href: '/admin', icon: FolderCog },
  { label: 'Logística', href: '/admin/logistica', icon: Truck },
  { label: 'Vendedor (Home)', href: '/vendedor', icon: Users },
]

export default function SidebarModern() {
  const pathname = usePathname()
  const { isOpen, isCollapsed, close } = useSidebar()

  return (
    <aside className={cn(
      "fixed md:static inset-y-0 left-0 z-40 md:flex w-64 flex-col bg-gray-950 text-gray-200 border-r border-gray-800 min-h-screen",
      "transition-transform", isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      isCollapsed ? 'md:w-20' : 'md:w-64'
    )}>
      <div className="px-4 py-4"><Logo href="/admin/overview" /></div>
      <nav className="flex-1 px-2 py-2 space-y-1">
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={`${href}-${label}`} href={href} onClick={close} className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              active ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white' : 'hover:bg-gray-900'
            )}>
              <Icon className="w-4 h-4" />
              {!isCollapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>
      <div className="px-4 py-3 text-xs text-gray-500">v1.0.0</div>
    </aside>
  )
}


