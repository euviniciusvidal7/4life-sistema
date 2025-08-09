"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

type SidebarState = {
  isOpen: boolean
  isCollapsed: boolean
  open: () => void
  close: () => void
  toggle: () => void
  collapse: () => void
  expand: () => void
}

const Ctx = createContext<SidebarState | null>(null)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const [isCollapsed, setCollapsed] = useState(false)

  // Fechar menu mobile ao redimensionar para desktop
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 1024) setOpen(false)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const value: SidebarState = {
    isOpen,
    isCollapsed,
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(v => !v),
    collapse: () => setCollapsed(true),
    expand: () => setCollapsed(false),
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSidebar() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSidebar must be used within SidebarProvider')
  return v
}


