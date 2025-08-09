"use client"

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import FinanceLayout from '@/components/dashboard/FinanceLayout'
import { Switch } from '@/components/ui/Switch'
import { Badge } from '@/components/ui/Badge'
import { User, Clock, Activity, Bell } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import StatsCard from '@/components/dashboard/StatsCard'

function SimpleCard({ title, icon, children }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {(title || icon) && (
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {icon}
            {title && <div className="text-lg font-semibold">{title}</div>}
          </div>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}

interface VendedorStatus {
  id: string
  login: string
  nome_completo: string
  online: boolean
  ultimo_acesso: string
  nivel_acesso: string
}

export default function VendedorPage() {
  const [status, setStatus] = useState<VendedorStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [mounted, setMounted] = useState(false)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  const [resumo, setResumo] = useState({
    rec: 0,
    vendidos: 0,
    novo_cliente: 0,
    lixeira: 0,
  })

  useEffect(() => { setMounted(true) }, [])

  const carregarStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${apiUrl}/api/admin/vendedor/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStatus(data.data)
        // Se não for vendedor, redirecionar para admin overview
        if (data?.data?.nivel_acesso && !['vendedor','recuperacao','vendas'].includes(String(data.data.nivel_acesso).toLowerCase())) {
          window.location.href = '/admin/overview'
        }
      } else {
        toast.error('Erro ao carregar status')
      }
    } catch {
      toast.error('Erro ao carregar status')
    } finally {
      setLoading(false)
    }
  }

  const carregarResumo = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      const [rRec, rVend, rNovo, rLix] = await Promise.all([
        fetch(`${apiUrl}/api/leads/meus?status=distribuido&tipo=recuperacao`, { headers }),
        fetch(`${apiUrl}/api/leads/meus?status=distribuido&tipo=vendido`, { headers }),
        fetch(`${apiUrl}/api/leads/meus?status=novo_cliente`, { headers }),
        fetch(`${apiUrl}/api/leads/lixeira`, { headers }),
      ])
      const [jRec, jVend, jNovo, jLix] = await Promise.all([
        rRec.ok ? rRec.json() : Promise.resolve({ leads: [] }),
        rVend.ok ? rVend.json() : Promise.resolve({ leads: [] }),
        rNovo.ok ? rNovo.json() : Promise.resolve({ leads: [] }),
        rLix.ok ? rLix.json() : Promise.resolve({ leads: [] }),
      ])
      setResumo({
        rec: (jRec.leads || []).length,
        vendidos: (jVend.leads || []).length,
        novo_cliente: (jNovo.leads || []).length,
        lixeira: (jLix.leads || []).length,
      })
    } catch {}
  }

  const toggleStatusOnline = async (novoStatus: boolean) => {
    try {
      setUpdating(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${apiUrl}/api/admin/vendedor/toggle-online`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      })
      if (response.ok) {
        const data = await response.json()
        setStatus(data.data)
        toast.success(data.message)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Erro ao atualizar status')
      }
    } catch {
      toast.error('Erro ao atualizar status')
    } finally {
      setUpdating(false)
    }
  }

  // Heartbeat a cada 60s para manter online sem cair quando trocar de aba
  useEffect(() => {
    if (!mounted) return
    carregarStatus()
    carregarResumo()

    const token = localStorage.getItem('token')
    const hb = setInterval(async () => {
      try {
        await fetch(`${apiUrl}/api/auth/heartbeat`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } })
      } catch {}
    }, 60000)

    // SSE para receber lead em tempo real
    const sseToken = localStorage.getItem('token')
    const es = new EventSource(`${apiUrl}/api/leads/events?token=${encodeURIComponent(sseToken || '')}`)
    es.addEventListener('lead_assigned', (evt: MessageEvent) => {
      try {
        const payload = JSON.parse(evt.data)
        toast.custom((t) => (
          <div className="bg-white shadow-lg rounded-lg p-3 flex items-center gap-2 border">
            <Bell className="w-4 h-4 text-blue-600" />
            <div className="text-sm">Novo lead atribuído! ID: {payload.leadId}</div>
          </div>
        ))
        // Após receber novo lead, podemos navegar para a seção mais utilizada
        // ou apenas manter no painel. Aqui só atualizamos status/feedback.
      } catch {}
    })

    const iv = setInterval(() => carregarResumo(), 15000)
    return () => { clearInterval(hb); clearInterval(iv); es.close() }
  }, [mounted])

  if (!mounted || loading) {
    return (
      <ProtectedRoute>
        <FinanceLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando...</p>
            </div>
          </div>
        </FinanceLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <FinanceLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Painel do Vendedor</h1>
            <Badge variant={status?.online ? 'default' : 'secondary'}>
              {status?.online ? 'Online' : 'Offline'}
            </Badge>
          </div>

          {/* Atalhos para áreas do vendedor */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/vendedor/recuperacao" className="px-3 py-2 rounded-md bg-blue-50 text-blue-700 text-sm text-center hover:bg-blue-100">Recuperação</Link>
            <Link href="/vendedor/novos-clientes" className="px-3 py-2 rounded-md bg-emerald-50 text-emerald-700 text-sm text-center hover:bg-emerald-100">Novos Clientes (Vendidos)</Link>
            <Link href="/vendedor/novo-cliente" className="px-3 py-2 rounded-md bg-cyan-50 text-cyan-700 text-sm text-center hover:bg-cyan-100">Pronto para Envio</Link>
            <Link href="/vendedor/lixeira" className="px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-sm text-center hover:bg-rose-100">Lixeira</Link>
          </div>

          {/* Resumo rápido */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatsCard title="Recuperação" value={resumo.rec} accent="cyan" change={0} changeLabel="vs 24h" />
            <StatsCard title="Vendidos" value={resumo.vendidos} accent="emerald" change={0} changeLabel="vs 24h" />
            <StatsCard title="Pronto para Envio" value={resumo.novo_cliente} accent="amber" change={0} changeLabel="vs 24h" />
            <StatsCard title="Lixeira" value={resumo.lixeira} accent="rose" change={0} changeLabel="vs 24h" />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <SimpleCard title="Status Online" icon={<Activity className="w-5 h-5" />}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{status?.online ? 'Ativo' : 'Inativo'}</span>
                  <Switch checked={status?.online || false} onCheckedChange={toggleStatusOnline} disabled={updating} />
                </div>
                <div className="text-xs text-gray-500">
                  {status?.online ? 'Você está disponível para receber leads' : 'Você não está disponível para receber leads'}
                </div>
              </div>
            </SimpleCard>

            <SimpleCard title="Informações" icon={<User className="w-5 h-5" />}>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Nome</label>
                  <p className="text-sm text-gray-900">{status?.nome_completo}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Login</label>
                  <p className="text-sm text-gray-900">{status?.login}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Nível de Acesso</label>
                  <p className="text-sm text-gray-900 capitalize">{status?.nivel_acesso}</p>
                </div>
              </div>
            </SimpleCard>

            <SimpleCard title="Último Acesso" icon={<Clock className="w-5 h-5" />}>
              <div className="text-sm text-gray-900">
                {status?.ultimo_acesso ? new Date(status.ultimo_acesso).toLocaleString('pt-BR') : 'Nunca'}
              </div>
            </SimpleCard>

            <SimpleCard title="Estatísticas">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status Atual:</span>
                  <Badge variant={status?.online ? 'default' : 'secondary'}>{status?.online ? 'Online' : 'Offline'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Disponível para:</span>
                  <span className="text-sm text-gray-900">{status?.online ? 'Receber leads' : 'Não disponível'}</span>
                </div>
              </div>
            </SimpleCard>
          </div>
        </div>
      </FinanceLayout>
    </ProtectedRoute>
  )
}
