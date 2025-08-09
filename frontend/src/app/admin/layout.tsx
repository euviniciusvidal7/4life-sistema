"use client"

import { ReactNode } from 'react'
import DashboardShell from '@/components/ux/DashboardShell'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}


