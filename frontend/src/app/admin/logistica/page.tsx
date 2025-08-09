'use client'

import { useEffect, useState } from 'react'
import SidebarModern from '@/components/ux/SidebarModern'
import TopbarSearch from '@/components/ux/TopbarSearch'
import SectionCard from '@/components/ux/SectionCard'
import { Toaster, toast } from 'react-hot-toast'
import { SidebarProvider } from '@/components/ux/SidebarContext'
import DataTable from '@/components/ux/DataTable'

type LogisticaEntry = { key: string; name: string; listId: string; total: number }

export default function AdminLogisticaPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const [logistica, setLogistica] = useState<LogisticaEntry[]>([])
  const [cards, setCards] = useState<any[]>([])
  const [listSelecionada, setListSelecionada] = useState<'PRONTO_ENVIO'|'EM_TRANSITO'|'ENTREGUE_PAGO'|'DEVOLVIDOS'>('PRONTO_ENVIO')

  async function carregar() {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${apiUrl}/api/admin/services/stats`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const json = await res.json()
        setLogistica(json.logistica || [])
      }
    } catch {}
  }

  useEffect(() => { carregar() }, [])
  useEffect(() => { listar(listSelecionada) }, [listSelecionada])

  async function listar(listKey: 'PRONTO_ENVIO'|'EM_TRANSITO'|'ENTREGUE_PAGO'|'DEVOLVIDOS') {
    try {
      const res = await fetch(`/api/logistica/listar?list=${listKey}`)
      if (res.ok) {
        const json = await res.json()
        setCards(json.cards || [])
      }
    } catch {}
  }

  const move = async (target: 'EM_TRANSITO'|'ENTREGUE_PAGO'|'DEVOLVIDOS') => {
    try {
      // Endpoint exige lead; aqui supomos mover por card selecionado em tela futura.
      // Neste MVP, apenas disparamos sincronização automática.
      const res = await fetch('/api/logistica/sincronizar')
      if (res.ok) toast.success('Sincronização acionada')
      else toast.error('Falha ao sincronizar')
    } catch { toast.error('Erro na requisição') }
  }

  const byKey = new Map(logistica.map(l => [l.key, l.total]))

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-950 text-gray-200 flex">
        <SidebarModern />
        <div className="flex-1 min-w-0">
          <TopbarSearch />
        <div className="mx-auto max-w-7xl p-6 space-y-6">
          <Toaster />
          <h1 className="text-2xl font-bold">Logística</h1>
          <p className="text-sm text-gray-400">Mover cards por etapa ou acionar sincronização automática com o rastreamento.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <SectionCard title="Pronto para Envio" right={<button onClick={()=>move('EM_TRANSITO')} className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-700 text-white text-xs">Processar → Trânsito</button>}>
              <div className="text-3xl font-bold">{byKey.get('pronto_envio') ?? '—'}</div>
            </SectionCard>
            <SectionCard title="Em Trânsito" right={<button onClick={()=>move('ENTREGUE_PAGO')} className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs">Entregue - Pago</button>}>
              <div className="text-3xl font-bold">{byKey.get('em_transito') ?? '—'}</div>
            </SectionCard>
            <SectionCard title="Entregue - Pago">
              <div className="text-3xl font-bold">{byKey.get('entregue_pago') ?? '—'}</div>
            </SectionCard>
            <SectionCard title="Devolvidos" right={<button onClick={()=>move('DEVOLVIDOS')} className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs">Marcar Devolvido</button>}>
              <div className="text-3xl font-bold">{byKey.get('devolvidos') ?? '—'}</div>
            </SectionCard>
          </div>

          <SectionCard title="Cards da Lista Selecionada" right={
            <select value={listSelecionada} onChange={(e)=>setListSelecionada(e.target.value as any)} className="bg-gray-900 border border-gray-800 text-gray-200 text-xs rounded px-2 py-1">
              <option value="PRONTO_ENVIO">Pronto para Envio</option>
              <option value="EM_TRANSITO">Em Trânsito</option>
              <option value="ENTREGUE_PAGO">Entregue - Pago</option>
              <option value="DEVOLVIDOS">Devolvidos</option>
            </select>
          }>
            <DataTable
              columns={[{key:'name',header:'Título'}, {key:'idShort',header:'ID', className:'text-right'}]}
              rows={cards.map((c:any)=>({ name: c.name, idShort: c.idShort }))}
            />
          </SectionCard>
        </div>
        </div>
      </div>
    </SidebarProvider>
  )
}


