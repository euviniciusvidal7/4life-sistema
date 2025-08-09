"use client"

import { ReactNode, useState, useEffect } from 'react'
import FinanceSidebar from '@/components/sidebar/FinanceSidebar'
import Breadcrumb from '@/components/ui/Breadcrumb'

interface FinanceLayoutProps {
  children: ReactNode
}

export default function FinanceLayout({ children }: FinanceLayoutProps) {
  const [sidebarState, setSidebarState] = useState({
    collapsed: false,
    isMobile: false
  })

  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768
      setSidebarState(prev => ({
        ...prev,
        isMobile,
        collapsed: isMobile ? true : prev.collapsed
      }))
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Heartbeat global: mantém ultimo_acesso atualizado em qualquer página autenticada
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) return
    const interval = setInterval(() => {
      fetch(`${apiUrl}/api/auth/heartbeat`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {})
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const getMainContentClasses = () => {
    if (sidebarState.isMobile) {
      return 'ml-0'
    }
    return sidebarState.collapsed ? 'ml-16' : 'ml-64'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Finance Sidebar */}
      <FinanceSidebar />

      {/* Main Content */}
      <div className={`flex flex-col transition-all duration-300 ${getMainContentClasses()}`}>
        <div className="min-h-screen">
          <div className="p-6">
            <Breadcrumb />
            {children}
          </div>
        </div>
      </div>
    </div>
  )
} 