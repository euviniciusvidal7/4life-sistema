"use client"

import { ReactNode, useState, useEffect } from 'react'
import Sidebar from '@/components/sidebar/Sidebar'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
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

  const getMainContentClasses = () => {
    if (sidebarState.isMobile) {
      return 'ml-0'
    }
    return sidebarState.collapsed ? 'ml-16' : 'ml-64'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className={`flex flex-col transition-all duration-300 ${getMainContentClasses()}`}>
        {children}
      </div>
    </div>
  )
}
