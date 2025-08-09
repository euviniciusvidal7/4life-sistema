"use client"

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href: string
  isActive?: boolean
}

export default function Breadcrumb() {
  const pathname = usePathname()
  
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/dashboard', isActive: false }
    ]

    // Caso especial: estamos exatamente no /dashboard
    if (segments.length === 1 && segments[0] === 'dashboard') {
      breadcrumbs[0].isActive = true
      return breadcrumbs
    }

    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Mapear segmentos para labels mais amigáveis
      let label = segment
      switch (segment) {
        case 'dashboard':
          label = 'Dashboard'
          break
        case 'finance':
          label = 'Financeiro'
          break
        case 'admin':
          label = 'Administração'
          break
        case 'vendedor':
          label = 'Vendedor'
          break
        case 'novos-clientes':
          label = 'Novos Clientes'
          break
        case 'recuperacao':
          label = 'Recuperação'
          break
        case 'novo-cliente':
          label = 'Novo Cliente'
          break
        case 'lixeira':
          label = 'Lixeira'
          break
        default:
          label = segment.charAt(0).toUpperCase() + segment.slice(1)
      }

      // Evitar duplicar '/dashboard' já adicionado como Home
      if (breadcrumbs.some(b => b.href === currentPath)) {
        // Atualizar ativo quando for o último
        if (index === segments.length - 1) {
          const i = breadcrumbs.findIndex(b => b.href === currentPath)
          if (i >= 0) breadcrumbs[i].isActive = true
        }
        return
      }

      breadcrumbs.push({
        label,
        href: currentPath,
        isActive: index === segments.length - 1
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 mb-6">
      {breadcrumbs.map((item, index) => (
        <div key={`${item.href}-${index}`} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          )}
          
          {item.isActive ? (
            <span className="font-medium text-gray-900 dark:text-white">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className={cn(
                "hover:text-blue-600 dark:hover:text-blue-400 transition-colors",
                index === 0 && "flex items-center gap-1"
              )}
            >
              {index === 0 && <Home className="w-4 h-4" />}
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
} 