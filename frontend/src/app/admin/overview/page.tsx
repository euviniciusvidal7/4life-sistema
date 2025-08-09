'use client'

import { useEffect, useState } from 'react'
import StatsCard from '@/components/dashboard/StatsCard'
import SectionCard from '@/components/ux/SectionCard'
import MiniLineChart from '@/components/ux/MiniLineChart'
import MiniBarChart from '@/components/ux/MiniBarChart'
import DataTable from '@/components/ux/DataTable'
import { Toaster, toast } from 'react-hot-toast'
import MiniAreaChart from '@/components/ux/MiniAreaChart'
import DashboardShell from '@/components/ux/DashboardShell'

type ServiceStats = {
  leads_disponiveis: number
  vendedores_online: number
  leads_da_pasta: number
  leads_recuperacao: number
  leads_venda: number
}

type DistributionStats = {
  total: number
  automatica: number
  manual: number
  porVendedor: Record<string, number>
}

type LogisticaEntry = { key: string; name: string; listId: string; total: number }

export default function AdminOverviewPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const [serviceStats, setServiceStats] = useState<ServiceStats | null>(null)
  const [distributionStats, setDistributionStats] = useState<DistributionStats | null>(null)
  const [vendedoresOnline, setVendedoresOnline] = useState<any[]>([])
  const [logistica, setLogistica] = useState<LogisticaEntry[] | null>(null)
  const [fileWatcherStatus, setFileWatcherStatus] = useState<'running'|'stopped'|'unknown'>('unknown')
  const [fileWatcherStats, setFileWatcherStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  async function carregar() {
    try {
      const token = localStorage.getItem('token')
      const [statsRes, vendRes] = await Promise.all([
        fetch(`${apiUrl}/api/admin/services/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/admin/services/vendedores/online`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      if (statsRes.ok) {
        const json = await statsRes.json()
        setServiceStats(json.serviceStats || null)
        setDistributionStats(json.distributionStats || null)
        setLogistica(json.logistica || null)
        setFileWatcherStatus(json.fileWatcherStatus || 'unknown')
        setFileWatcherStats(json.fileWatcherStats || null)
      }
      if (vendRes.ok) {
        const json = await vendRes.json()
        setVendedoresOnline(json.vendedores || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
    const iv = setInterval(() => carregar(), 15000)
    // SSE de presença para atualizar Vendedores Online em tempo real
    const es = new EventSource(`${apiUrl}/api/admin/events/stream`)
    const onPresence = () => {
      // Atualiza apenas a lista de vendedores online, mantendo demais dados
      const token = localStorage.getItem('token')
      fetch(`${apiUrl}/api/admin/services/vendedores/online`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : Promise.resolve({ vendedores: [] }))
        .then(json => setVendedoresOnline(json.vendedores || []))
        .catch(()=>{})
    }
    es.addEventListener('presence', onPresence as any)
    return () => { clearInterval(iv); es.close() }
  }, [])

  return (
    <DashboardShell>
        <div className="space-y-6">
          <Toaster />
          <div>
            <h1 className="text-2xl font-bold text-white">Visão Geral</h1>
            <p className="text-sm text-gray-400">Resumo de serviços e distribuição</p>
          </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Leads Disponíveis (Hoje)"
          value={serviceStats?.leads_disponiveis ?? '—'}
          trend="neutral"
          accent="emerald"
        />
        <StatsCard
          title="Vendedores Online"
          value={vendedoresOnline.length}
          trend="neutral"
          accent="cyan"
        />
        <StatsCard
          title="Leads da Pasta"
          value={serviceStats?.leads_da_pasta ?? '—'}
          trend="neutral"
          accent="amber"
        />
        <StatsCard
          title="Distribuídos (Hoje)"
          value={distributionStats?.total ?? 0}
          trend="neutral"
          accent="rose"
        />
      </div>

      {loading && (
        <div className="text-sm text-gray-400">Carregando...</div>
      )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <SectionCard title="Distribuição (Visão Geral)">
              <MiniAreaChart data={[
                { label: 'Jan', value: (distributionStats?.total ?? 0) * 0.2 + 2 },
                { label: 'Fev', value: (distributionStats?.total ?? 0) * 0.3 + 4 },
                { label: 'Mar', value: (distributionStats?.total ?? 0) * 0.4 + 3 },
                { label: 'Abr', value: (distributionStats?.total ?? 0) * 0.5 + 5 },
                { label: 'Mai', value: (distributionStats?.total ?? 0) * 0.6 + 6 },
                { label: 'Jun', value: (distributionStats?.total ?? 0) * 0.7 + 7 },
              ]} />
            </SectionCard>

            <SectionCard title="Devoluções (aprox.)">
              <MiniBarChart data={[
                { label: 'Recup.', value: serviceStats?.leads_recuperacao ?? 0 },
                { label: 'Vendidos', value: serviceStats?.leads_venda ?? 0 },
              ]} />
            </SectionCard>

            <SectionCard title="Logística (Trello)">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {(() => {
                  const byKey = new Map((logistica || []).map(l => [l.key, l.total]))
                  const pronto = byKey.get('pronto_envio') ?? '—'
                  const transito = byKey.get('em_transito') ?? '—'
                  const entregue = byKey.get('entregue_pago') ?? '—'
                  const devolvidos = byKey.get('devolvidos') ?? '—'
                  return (
                    <>
                      <div className="bg-gray-800 rounded-lg p-3"><div className="text-gray-400">Pronto para Envio</div><div className="text-2xl font-bold">{pronto}</div></div>
                      <div className="bg-gray-800 rounded-lg p-3"><div className="text-gray-400">Em Trânsito</div><div className="text-2xl font-bold">{transito}</div></div>
                      <div className="bg-gray-800 rounded-lg p-3"><div className="text-gray-400">Entregue - Pago</div><div className="text-2xl font-bold">{entregue}</div></div>
                      <div className="bg-gray-800 rounded-lg p-3"><div className="text-gray-400">Devolvidos</div><div className="text-2xl font-bold">{devolvidos}</div></div>
                    </>
                  )
                })()}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Leads por Vendedor (Hoje)" className="mt-6">
            <DataTable
              columns={[
                { key: 'vendedor', header: 'Vendedor' },
                { key: 'quantidade', header: 'Recebeu Hoje', className: 'text-right' },
                { key: 'perc', header: '% do total', className: 'text-right' },
              ]}
              rows={(() => {
                const map = distributionStats?.porVendedor || {}
                const total = distributionStats?.total || 0
                const rows = Object.entries(map).map(([nome, q]) => ({ vendedor: nome, quantidade: q, perc: total ? `${Math.round((q/total)*100)}%` : '0%' }))
                return rows.sort((a,b)=> b.quantidade - a.quantidade)
              })()}
            />
          </SectionCard>

          {/* Ações rápidas e FileWatcher */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SectionCard title="Ações Rápidas">
              <div className="flex flex-wrap gap-3">
                <button
                  className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={async ()=>{
                    try {
                      const token = localStorage.getItem('token')
                      const r = await fetch(`${apiUrl}/api/admin/services/process-existing`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
                      if (r.ok) { toast.success('Arquivos existentes processados'); await carregar() } else { toast.error('Falha ao processar arquivos') }
                    } catch { toast.error('Erro na requisição') }
                  }}
                >
                  Processar Arquivos
                </button>
                <button
                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={async ()=>{
                    try {
                      const token = localStorage.getItem('token')
                      const r = await fetch(`${apiUrl}/api/admin/distribution/manual-batch`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
                      if (r.ok) { toast.success('Distribuição em lote concluída'); await carregar() } else { toast.error('Falha ao distribuir') }
                    } catch { toast.error('Erro na requisição') }
                  }}
                >
                  Distribuir Agora
                </button>
                <button
                  className="px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={async ()=>{
                    try {
                      const token = localStorage.getItem('token')
                      const r = await fetch(`${apiUrl}/api/admin/distribution/process-queue`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
                      if (r.ok) { toast.success('Fila redistribuída'); await carregar() } else { toast.error('Falha ao redistribuir fila') }
                    } catch { toast.error('Erro na requisição') }
                  }}
                >
                  Redistribuir Fila
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Status do FileWatcher">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Pasta Monitorada</div>
                  <div className="text-sm text-gray-200 break-all">{fileWatcherStats?.pastaMonitorada || '—'}</div>
                  <div className="mt-2 text-sm text-gray-400">Delay</div>
                  <div className="text-sm text-gray-200">{fileWatcherStats?.delayProcessamento ? `${Math.round(fileWatcherStats.delayProcessamento/1000)}s` : '—'}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${fileWatcherStatus==='running'?'bg-emerald-600/20 text-emerald-400':'bg-red-600/20 text-red-400'}`}>
                    {fileWatcherStatus==='running'?'Ativo':'Parado'}
                  </span>
                  <button
                    className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={async ()=>{
                      try {
                        const token = localStorage.getItem('token')
                        const r = await fetch(`${apiUrl}/api/admin/services/filewatcher/start`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
                        if (r.ok) { toast.success('FileWatcher iniciado'); await carregar() } else { toast.error('Falha ao iniciar') }
                      } catch { toast.error('Erro na requisição') }
                    }}
                  >Iniciar</button>
                  <button
                    className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white"
                    onClick={async ()=>{
                      try {
                        const token = localStorage.getItem('token')
                        const r = await fetch(`${apiUrl}/api/admin/services/filewatcher/stop`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
                        if (r.ok) { toast.success('FileWatcher parado'); await carregar() } else { toast.error('Falha ao parar') }
                      } catch { toast.error('Erro na requisição') }
                    }}
                  >Parar</button>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
    </DashboardShell>
  )
}


