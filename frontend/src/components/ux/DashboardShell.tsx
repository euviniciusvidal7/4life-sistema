"use client"

import { ReactNode, useEffect } from 'react'
import { SidebarProvider } from './SidebarContext'
import SidebarModern from './SidebarModern'
import TopbarSearch from './TopbarSearch'

export default function DashboardShell({ children }: { children: ReactNode }) {
  // Heartbeat global para manter presença online
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) return
    const interval = setInterval(() => {
      fetch(`${apiUrl}/api/auth/heartbeat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-950 text-gray-200 flex">
        <SidebarModern />
        <div className="flex-1 min-w-0">
          <TopbarSearch />
          <main className="mx-auto max-w-7xl p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}


