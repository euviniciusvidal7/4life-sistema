"use client"

import { useEffect, useState } from 'react'
import FinanceLayout from '@/components/dashboard/FinanceLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface Lead {
  id: string
  nome: string | null
  contato: string | null
  status: string | null
  rec?: boolean
  created_at: string
}

export default function NovoClientePage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  async function carregar() {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const resp = await fetch(`${apiUrl}/api/leads/meus?status=novo_cliente`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await resp.json()
      setLeads(data.leads || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
    // Atualização periódica e SSE para espelhar a lógica de Recuperação
    const iv = setInterval(() => carregar(), 15000)
    const token = localStorage.getItem('token')
    try {
      const es = new EventSource(`${apiUrl}/api/leads/events?token=${encodeURIComponent(token || '')}`)
      const handler = () => carregar()
      es.addEventListener('lead_assigned', handler as any)
      return () => { clearInterval(iv); es.close() }
    } catch {
      return () => { clearInterval(iv) }
    }
  }, [])

  return (
    <ProtectedRoute>
      <FinanceLayout>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  PRONTO PARA ENVIO (Confirmados)
                </CardTitle>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600">Total: {leads.length}</span>
                  <button onClick={carregar} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Atualizar
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        if (!leads || leads.length === 0) return
                        const body = { target: 'EM_TRANSITO', lead: { id: leads[0]?.id, nome: leads[0]?.nome, contato: leads[0]?.contato } }
                        const resp = await fetch('/api/logistica/mover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
                        if (resp.ok) {
                          toast.success('Movido para EM TRANSITO')
                        } else {
                          const err = await resp.json().catch(()=>({}))
                          toast.error(err?.error || 'Falha ao mover')
                        }
                      } catch {
                        toast.error('Falha ao mover')
                      }
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded"
                  >
                    Processar (EM TRANSITO)
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500 text-sm">Carregando...</p>
              ) : leads.length === 0 ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <AlertCircle className="w-4 h-4" />
                  Nenhum cliente confirmado ainda.
                </div>
              ) : (
                <div className="space-y-2">
                  {leads.map((lead) => (
                    <div key={lead.id} className="border rounded-md p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{lead.nome || 'Sem nome'}</p>
                        <p className="text-sm text-gray-600">{lead.contato}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-700">{lead.status}</span>
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