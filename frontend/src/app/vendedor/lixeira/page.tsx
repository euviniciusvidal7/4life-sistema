"use client"

import { useEffect, useState } from 'react'
import FinanceLayout from '@/components/dashboard/FinanceLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, AlertCircle } from 'lucide-react'

interface Lead {
  id: string
  nome: string | null
  contato: string | null
  status: string | null
  rec?: boolean
  created_at: string
}

export default function LixeiraPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  async function carregar() {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const resp = await fetch(`${apiUrl}/api/leads/lixeira`, {
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
  }, [])

  return (
    <ProtectedRoute>
      <FinanceLayout>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                Lixeira (repescagem)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500 text-sm">Carregando...</p>
              ) : leads.length === 0 ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <AlertCircle className="w-4 h-4" />
                  Nenhum lead na lixeira.
                </div>
              ) : (
                <div className="space-y-2">
                  {leads.map((lead) => (
                    <div key={lead.id} className="border rounded-md p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{lead.nome || 'Sem nome'}</p>
                        <p className="text-sm text-gray-600">{lead.contato}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-red-50 text-red-700">{lead.status}</span>
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