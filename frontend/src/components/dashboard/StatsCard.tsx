import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: ReactNode
  className?: string
  trend?: 'up' | 'down' | 'neutral'
  accent?: 'emerald' | 'cyan' | 'amber' | 'rose'
}

export default function StatsCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon, 
  className,
  trend = 'neutral',
  accent = 'emerald'
}: StatsCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400'
      case 'down':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />
      case 'down':
        return <TrendingDown className="w-4 h-4" />
      default:
        return null
    }
  }

  const accentMap: Record<string, {bg: string; ring: string; text: string}> = {
    emerald: { bg: 'from-emerald-600/10 to-cyan-600/10', ring: 'ring-emerald-500/20', text: 'text-emerald-400' },
    cyan:    { bg: 'from-cyan-600/10 to-emerald-600/10', ring: 'ring-cyan-500/20', text: 'text-cyan-400' },
    amber:   { bg: 'from-amber-500/10 to-orange-600/10', ring: 'ring-amber-500/20', text: 'text-amber-400' },
    rose:    { bg: 'from-rose-500/10 to-fuchsia-600/10', ring: 'ring-rose-500/20', text: 'text-rose-400' },
  }
  const a = accentMap[accent]

  return (
    <div className={cn(
      "relative rounded-xl p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900",
      "hover:shadow-md transition-all duration-200 ring-1", a.ring,
      "bg-gradient-to-br", a.bg,
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {(change !== undefined || changeLabel) && (
            <div className="flex items-center gap-1 mt-2">
              {getTrendIcon() && (
                <span className={getTrendColor()}>
                  {getTrendIcon()}
                </span>
              )}
              {change !== undefined && (
                <span className={cn("text-sm font-medium", getTrendColor())}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
              )}
              {changeLabel && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className={cn("flex-shrink-0 rounded-full p-2 bg-gray-800", a.text)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
} 