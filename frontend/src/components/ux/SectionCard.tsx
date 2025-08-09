import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export default function SectionCard({
  title,
  right,
  children,
  className,
}: {
  title: string
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('bg-gray-900 border border-gray-800 rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-200">{title}</h2>
        {right}
      </div>
      <div>{children}</div>
    </section>
  )
}


