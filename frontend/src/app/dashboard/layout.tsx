"use client"

import { ReactNode } from 'react'
import DashboardShell from '@/components/ux/DashboardShell'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}


