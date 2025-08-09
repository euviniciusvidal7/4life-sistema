"use client"

import { Bell, Search, Menu, LogOut } from 'lucide-react'
import Logo from './Logo'
import { useSidebar } from './SidebarContext'

export default function TopbarSearch() {
  return (
    <header className="sticky top-0 z-10 bg-gray-950/70 backdrop-blur supports-[backdrop-filter]:bg-gray-950/50 border-b border-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
        <Hamburger />
        <div className="md:hidden"><Logo href="/admin/overview" /></div>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            placeholder="Pesquise qualquer coisa"
            className="w-full bg-gray-900 text-gray-200 pl-9 pr-3 py-2 rounded-md border border-gray-800 outline-none focus:ring-2 focus:ring-emerald-600 placeholder:text-gray-500"
          />
        </div>
        <button className="p-2 rounded-md hover:bg-gray-900 text-gray-300">
          <Bell className="w-5 h-5" />
        </button>
        <button
          className="p-2 rounded-md hover:bg-gray-900 text-gray-300"
          onClick={() => {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            localStorage.removeItem('cargo')
            window.location.href = '/login'
          }}
          title="Sair"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}

function Hamburger() {
  const { toggle } = useSidebar()
  return (
    <button onClick={toggle} className="p-2 rounded-md hover:bg-gray-900 text-gray-300 md:hidden">
      <Menu className="w-5 h-5" />
    </button>
  )
}


