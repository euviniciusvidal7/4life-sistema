"use client"

import { useEffect, useState } from 'react'
import FinanceLayout from '@/components/dashboard/FinanceLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'

interface Lead {
  id: string
  nome: string | null
  contato: string | null
  status: string | null
  rec?: boolean
  created_at: string
}

export default function NovosClientesPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [processingAll, setProcessingAll] = useState(false)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  async function carregar() {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const resp = await fetch(`${apiUrl}/api/leads/meus?status=distribuido&tipo=vendido`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await resp.json()
      setLeads(data.leads || [])
    } finally {
      setLoading(false)
    }
  }

  async function confirmar(leadId: string) {
    try {
      const token = localStorage.getItem('token')
      const resp = await fetch(`${apiUrl}/api/leads/confirmar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId })
      })
      if (resp.ok) {
        toast.success('Lead confirmado como novo cliente')
        carregar()
      } else {
        const err = await resp.json().catch(()=>({}))
        toast.error(err.error || 'Erro ao confirmar')
      }
    } catch {
      toast.error('Erro ao confirmar')
    }
  }

  async function processarTodos() {
    try {
      if (!leads || leads.length === 0) return
      setProcessingAll(true)
      const token = localStorage.getItem('token')
      let ok = 0, fail = 0
      await Promise.all(
        leads.map(async (lead) => {
          try {
            const resp = await fetch(`${apiUrl}/api/leads/confirmar`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ leadId: lead.id })
            })
            if (resp.ok) ok++
            else fail++
          } catch {
            fail++
          }
        })
      )
      toast.success(`Processados: ${ok} • Falhas: ${fail}`)
      await carregar()
    } catch {
      toast.error('Erro ao processar pedidos')
    } finally {
      setProcessingAll(false)
    }
  }

  async function lixeira(leadId: string) {
    try {
      const token = localStorage.getItem('token')
      const resp = await fetch(`${apiUrl}/api/leads/lixeira`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId })
      })
      if (resp.ok) {
        toast.success('Lead movido para lixeira')
        carregar()
      } else {
        const err = await resp.json().catch(()=>({}))
        toast.error(err.error || 'Erro ao mover para lixeira')
      }
    } catch {
      toast.error('Erro ao mover para lixeira')
    }
  }

  useEffect(() => {
    carregar()
    const iv = setInterval(() => carregar(), 15000)
    const token = localStorage.getItem('token')
    const es = new EventSource(`${apiUrl}/api/leads/events?token=${encodeURIComponent(token || '')}`)
    const handler = () => carregar()
    es.addEventListener('lead_assigned', handler as any)
    return () => { clearInterval(iv); es.close() }
  }, [])

  return (
    <ProtectedRoute>
      <FinanceLayout>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                  Novos Clientes (Vendidos)
                </CardTitle>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600">Total: {leads.length}</span>
                  <button onClick={carregar} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded">Atualizar</button>
                  <button
                    onClick={processarTodos}
                    disabled={processingAll || leads.length === 0}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded disabled:opacity-50"
                    title="Confirmar todos os pedidos da lista"
                  >
                    {processingAll ? 'Processando...' : 'Processar Todos'}
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500 text-sm">Carregando...</p>
              ) : leads.length === 0 ? (
                <p className="text-gray-500 text-sm">Sem clientes vendidos.</p>
              ) : (
                <div className="space-y-2">
                  {leads.map((lead) => (
                    <div key={lead.id} className="border rounded-md p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-800">{lead.nome || 'Sem nome'}</p>
                        <p className="text-sm text-green-700">{lead.contato}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={()=>lixeira(lead.id)} className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">Lixeira</button>
                        <button onClick={()=>confirmar(lead.id)} className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Confirmar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </FinanceLayout>
    </ProtectedRoute>
  )
}


