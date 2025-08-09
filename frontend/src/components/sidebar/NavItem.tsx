"use client"

import { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface NavItemProps {
  icon: LucideIcon
  label: string
  href?: string
  isActive?: boolean
  collapsed?: boolean
  onClick?: () => void
}

export default function NavItem({ 
  icon: Icon, 
  label, 
  href, 
  isActive = false, 
  collapsed = false,
  onClick 
}: NavItemProps) {
  const baseClasses = `w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
    isActive
      ? 'shadow-sm'
      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
  }`

  const activeStyle = {
    backgroundColor: isActive ? '#4EF45E' : 'transparent',
    color: isActive ? '#1f2937' : undefined
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (!isActive) {
      const isDarkMode = document.documentElement.classList.contains('dark')
      e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#f3f4f6'
    }
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (!isActive) {
      e.currentTarget.style.backgroundColor = 'transparent'
    }
  }

  const content = (
    <>
      <Icon 
        size={20} 
        className={isActive ? 'text-gray-800' : 'text-gray-500 dark:text-gray-400'} 
      />
      {!collapsed && <span className="font-medium">{label}</span>}
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className={`${baseClasses} ${collapsed ? 'justify-center' : ''}`}
        style={activeStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        title={collapsed ? label : undefined}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${collapsed ? 'justify-center' : ''}`}
      style={activeStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={collapsed ? label : undefined}
    >
      {content}
    </button>
  )
}
