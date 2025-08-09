import { cn } from '@/lib/utils'

type Column = { key: string; header: string; className?: string }

export default function DataTable({
  columns,
  rows,
  className,
}: {
  columns: Column[]
  rows: any[]
  className?: string
}) {
  return (
    <div className={cn('overflow-auto rounded-lg border border-gray-800', className)}>
      <table className="min-w-full text-sm text-gray-200">
        <thead className="bg-gray-900/70">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={cn('text-left px-4 py-2 font-semibold text-gray-300', c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-4 text-gray-400">
                Nenhum dado disponível.
              </td>
            </tr>
          ) : (
            rows.map((r, idx) => (
              <tr key={idx} className={idx % 2 ? 'bg-gray-900/40' : ''}>
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-4 py-2', c.className)}>
                    {String(r[c.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}


