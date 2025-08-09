"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Toaster, toast } from 'react-hot-toast'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import FinanceLayout from '@/components/dashboard/FinanceLayout'
import { 
  Users, 
  FileText, 
  RefreshCw, 
  Settings, 
  Play, 
  Pause, 
  Activity,
  Database,
  FolderOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  DollarSign,
  Percent,
  Target,
  Zap
} from 'lucide-react'

interface ServiceStats {
  leads_disponiveis: number
  vendedores_online: number
  leads_da_pasta: number
  leads_recuperacao: number
  leads_venda: number
}

interface FileWatcherStats {
  pastaMonitorada: string
  delayProcessamento: number
  arquivosProcessados: number
  arquivosEmMemoria: string[]
}

interface DistributionStats {
  total: number
  automatica: number
  manual: number
  porVendedor: Record<string, number>
}

interface Lead {
  arquivo: string
  nome: string
  contato: string
  problema_relatado: string
  rec: boolean
  timestamp: string
  hora_chegada: string
  tipo: string
  status: string
  perguntas_feitas: string[]
  conversa_ia: any[]
  pacote_escolhido: string | null
  endereco: string | null
}

interface Vendedor {
  id: string
  nome: string
  login: string
  nivel_acesso: string
  ultimo_acesso: string
  status_online: boolean
  porcentagem_leads?: number
  leads_recebidos?: number
}

interface DistribuicaoConfig {
  vendedor_id: string
  vendedor_nome: string
  porcentagem: number
  tipo_leads: 'recuperacao' | 'venda' | 'ambos'
}

// Componente filho para configuração de vendedor (evita hooks dentro de função no render)
function VendedorConfigCard({
  vendedor,
  config,
  presenceSeconds,
  hbSeconds,
  onSave
}: {
  vendedor: any
  config?: DistribuicaoConfig
  presenceSeconds: number
  hbSeconds?: number | null
  onSave: (porcentagem: number, tipoLeads: 'recuperacao' | 'venda' | 'ambos') => void
}) {
  const [porcentagem, setPorcentagem] = useState<number>(config?.porcentagem || 0)
  const [tipoLeads, setTipoLeads] = useState<'recuperacao' | 'venda' | 'ambos'>(config?.tipo_leads || 'ambos')

  const onlineChip = vendedor.status_online ? 'bg-green-500' : 'bg-gray-400'
  const hbText = hbSeconds != null ? (hbSeconds < 60 ? `${hbSeconds}s` : `${Math.floor(hbSeconds/60)}m`) : '—'
  const onlineText = presenceSeconds < 60 ? `${presenceSeconds}s` : `${Math.floor(presenceSeconds/60)}m`

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${onlineChip}`}></div>
          <div>
            <h4 className="font-medium text-gray-900">{vendedor.nome}</h4>
            <p className="text-sm text-gray-600">{vendedor.login}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-700 font-medium">{vendedor.status_online ? 'Online' : 'Offline'}</div>
          <div className="text-[11px] text-gray-500">HB: {hbText} • Hoje: {onlineText}</div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Porcentagem de Leads</label>
          <div className="flex items-center gap-2">
            <input type="range" min={0} max={100} value={porcentagem} onChange={(e)=>setPorcentagem(Number(e.target.value))} className="w-40" />
            <input type="number" min="0" max="100" value={porcentagem} onChange={(e)=>setPorcentagem(Number(e.target.value))} className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
            <span className="text-sm text-gray-500">%</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Leads</label>
          <select
            value={tipoLeads}
            onChange={(e) => setTipoLeads(e.target.value as any)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="ambos">Ambos (Recuperação + Venda)</option>
            <option value="recuperacao">Apenas Recuperação</option>
            <option value="venda">Apenas Venda</option>
          </select>
        </div>

        <button
          onClick={() => onSave(porcentagem, tipoLeads)}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Salvar Configuração
        </button>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [serviceStats, setServiceStats] = useState<ServiceStats | null>(null)
  const [fileWatcherStats, setFileWatcherStats] = useState<FileWatcherStats | null>(null)
  const [distributionStats, setDistributionStats] = useState<DistributionStats | null>(null)
  const [leadsRecuperacao, setLeadsRecuperacao] = useState<Lead[]>([])
  const [leadsVendidos, setLeadsVendidos] = useState<Lead[]>([])
  const [vendedoresOnline, setVendedoresOnline] = useState<Vendedor[]>([])
  const [presenceStats, setPresenceStats] = useState<Record<string, number>>({})
  const [configuracoesDistribuicao, setConfiguracoesDistribuicao] = useState<DistribuicaoConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [fileWatcherStatus, setFileWatcherStatus] = useState<'running' | 'stopped' | 'unknown'>('unknown')
  const [distribuicaoAtiva, setDistribuicaoAtiva] = useState(false)
  const [onlyOnline, setOnlyOnline] = useState(true)

  useEffect(() => {
    carregarDados()
    const interval = setInterval(carregarDados, 10000) // Atualizar a cada 10 segundos para refletir presença

    // SSE para presença
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const es = new EventSource(`${apiUrl}/api/admin/events/stream`)
    es.addEventListener('presence', (evt: MessageEvent) => {
      try {
        const payload = JSON.parse(evt.data)
        // Atualizar lista de vendedores online de forma otimista
        setVendedoresOnline(prev => {
          // Se já estiver na lista e foi offline, remover; se online, inserir/atualizar
          const exists = prev.find(v => v.login === payload.login || v.id === payload.userId)
          if (payload.online) {
            if (exists) {
              return prev.map(v => (v.login === payload.login || v.id === payload.userId) ? { ...v, status_online: true, nome: v.nome || v.login, ultimo_acesso: new Date().toISOString() } : v)
            } else {
              // Inserção otimista mínima
              return [{ id: payload.userId, login: payload.login, nome: payload.login, nivel_acesso: 'vendedor', ultimo_acesso: new Date().toISOString(), status_online: true }, ...prev]
            }
          } else {
            // marcar offline
            return prev.map(v => (v.login === payload.login || v.id === payload.userId) ? { ...v, status_online: false } : v)
          }
        })
      } catch {}
    })

    return () => {
      clearInterval(interval)
      es.close()
    }
  }, [])

  const carregarDados = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

      // Carregar estatísticas dos serviços
      const statsResponse = await fetch(`${apiUrl}/api/admin/services/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setServiceStats(statsData.serviceStats)
        setFileWatcherStats(statsData.fileWatcherStats)
        setDistributionStats(statsData.distributionStats)
        setFileWatcherStatus(statsData.fileWatcherStatus)
      }

      // Carregar leads da pasta
      const leadsResponse = await fetch(`${apiUrl}/api/admin/services/leads/pasta`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json()
        const leads = leadsData.leads || []
        
        // Separar leads por tipo (Rec: true = Recuperação, Rec: false = Vendido)
        const recuperacao = leads.filter((lead: Lead) => lead.rec === true)
        const vendidos = leads.filter((lead: Lead) => lead.rec === false)
        
        setLeadsRecuperacao(recuperacao)
        setLeadsVendidos(vendidos)
      }

      // Carregar vendedores online
      const vendedoresResponse = await fetch(`${apiUrl}/api/admin/services/vendedores/online`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (vendedoresResponse.ok) {
        const vendedoresData = await vendedoresResponse.json()
        const listaRaw = (vendedoresData.vendedores || []).map((v: any) => ({
          ...v,
          status_online: typeof v.status_online === 'boolean' ? v.status_online : !!v.online,
          nome: v.nome || v.nome_completo || v.login
        }))
        // Buscar stats de presença (tempo online hoje)
        await carregarPresenceStats()
        const now = Date.now()
        const lista = listaRaw.map((v: any) => {
          const hbSec = v.ultimo_acesso ? Math.floor((now - new Date(v.ultimo_acesso).getTime()) / 1000) : null
          const computedOnline = v.status_online && hbSec !== null && hbSec <= 120
          return { ...v, status_online: computedOnline, _hbSec: hbSec }
        })
        setVendedoresOnline(lista)
      }

      // Carregar configurações de distribuição
      const configResponse = await fetch(`${apiUrl}/api/admin/distribution/config`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (configResponse.ok) {
        const configData = await configResponse.json()
        setConfiguracoesDistribuicao(configData.configuracoes || [])
        setDistribuicaoAtiva(configData.ativa || false)
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const carregarPresenceStats = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const presResp = await fetch(`${apiUrl}/api/admin/presenca/stats`)
      if (presResp.ok) {
        const presData = await presResp.json()
        const map: Record<string, number> = {}
        for (const s of presData.stats || []) {
          map[s.user_id] = s.segundos_online_hoje || 0
        }
        setPresenceStats(map)
      }
    } catch {}
  }

  const toggleFileWatcher = async (action: 'start' | 'stop') => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

      const response = await fetch(`${apiUrl}/api/admin/services/filewatcher/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success(`FileWatcher ${action === 'start' ? 'iniciado' : 'parado'} com sucesso!`)
        carregarDados()
      } else {
        toast.error(`Erro ao ${action === 'start' ? 'iniciar' : 'parar'} FileWatcher`)
      }
    } catch (error) {
      toast.error(`Erro ao ${action === 'start' ? 'iniciar' : 'parar'} FileWatcher`)
    }
  }

  const processarArquivosExistentes = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

      const response = await fetch(`${apiUrl}/api/admin/services/process-existing`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('Arquivos existentes processados com sucesso!')
        carregarDados()
      } else {
        toast.error('Erro ao processar arquivos existentes')
      }
    } catch (error) {
      toast.error('Erro ao processar arquivos existentes')
    }
  }

  const atualizarConfiguracaoVendedor = async (vendedorId: string, porcentagem: number, tipoLeads: 'recuperacao' | 'venda' | 'ambos') => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

      const response = await fetch(`${apiUrl}/api/admin/distribution/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vendedor_id: vendedorId,
          porcentagem,
          tipo_leads: tipoLeads
        })
      })

      if (response.ok) {
        toast.success('Configuração atualizada com sucesso!')
        carregarDados()
      } else {
        toast.error('Erro ao atualizar configuração')
      }
    } catch (error) {
      toast.error('Erro ao atualizar configuração')
    }
  }

  const toggleDistribuicaoAutomatica = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

      const response = await fetch(`${apiUrl}/api/admin/distribution/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const novaStatus = !distribuicaoAtiva
        setDistribuicaoAtiva(novaStatus)
        toast.success(`Distribuição automática ${novaStatus ? 'ativada' : 'desativada'}!`)
      } else {
        toast.error('Erro ao alterar status da distribuição')
      }
    } catch (error) {
      toast.error('Erro ao alterar status da distribuição')
    }
  }

  const distribuirLeadsManualmente = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

      const response = await fetch(`${apiUrl}/api/admin/distribution/manual-batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const json = await response.json()
        const r = json.resultado || {}
        toast.success(`Distribuído: ${r.distribuido ?? '-'} • Aguardando: ${r.aguardando ?? '-'} • Erros: ${r.erros ?? '-'}`)
        carregarDados()
      } else {
        toast.error('Erro ao distribuir leads')
      }
    } catch (error) {
      toast.error('Erro ao distribuir leads')
    }
  }

  const redistribuirFila = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

      const response = await fetch(`${apiUrl}/api/admin/distribution/process-queue`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const json = await response.json()
        const r = json.resultado || {}
        toast.success(`Fila: Distribuído: ${r.distribuido ?? '-'} • Aguardando: ${r.aguardando ?? '-'} • Erros: ${r.erros ?? '-'}`)
        carregarDados()
      } else {
        toast.error('Erro ao redistribuir fila')
      }
    } catch {
      toast.error('Erro ao redistribuir fila')
    }
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'distribution', label: 'Distribuição', icon: TrendingUp },
    { id: 'users', label: 'Vendedores', icon: UserCheck },
    { id: 'services', label: 'Serviços', icon: Settings },
    { id: 'filewatcher', label: 'FileWatcher', icon: FolderOpen }
  ]

  // Estado e ações para gestão de usuários
  const [users, setUsers] = useState<Vendedor[]>([])
  const [creating, setCreating] = useState(false)
  const [newUser, setNewUser] = useState({
    login: '',
    senha: '',
    nome: '',
    email: '',
    nivel_acesso: 'vendedor' as 'vendedor' | 'recuperacao'
  })

  const carregarUsuarios = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const resp = await fetch(`${apiUrl}/api/auth/users?nivel=vendedor,recuperacao`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (resp.ok) {
        const data = await resp.json()
        const lista = (data.users || []).map((u: any) => ({
          ...u,
          status_online: typeof u.status_online === 'boolean' ? u.status_online : !!u.online,
          nome: u.nome || u.nome_completo || u.login
        }))
        setUsers(lista)
        await carregarPresenceStats()
      }
    } catch {}
  }

  useEffect(() => {
    if (activeTab === 'users') carregarUsuarios()
  }, [activeTab])

  const criarUsuario = async () => {
    try {
      setCreating(true)
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

      if (!newUser.login || !newUser.senha || !newUser.nome || !newUser.email) {
        toast.error('Preencha todos os campos')
        return
      }

      const resp = await fetch(`${apiUrl}/api/auth/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      })

      if (resp.ok) {
        toast.success('Usuário criado com sucesso!')
        setNewUser({ login: '', senha: '', nome: '', email: '', nivel_acesso: 'vendedor' })
        carregarUsuarios()
      } else {
        const err = await resp.json().catch(() => ({}))
        toast.error(err.error || 'Erro ao criar usuário')
      }
    } catch {
      toast.error('Erro ao criar usuário')
    } finally {
      setCreating(false)
    }
  }

  const renderLeadCard = (lead: Lead, tipo: 'recuperacao' | 'vendido') => {
    return (
      <div key={lead.arquivo} className="bg-white rounded-lg shadow p-4 border-l-4 border-l-blue-500">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              tipo === 'recuperacao' ? 'bg-orange-500' : 'bg-green-500'
            }`}></div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              tipo === 'recuperacao' 
                ? 'bg-orange-100 text-orange-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {tipo === 'recuperacao' ? 'Recuperação' : 'Vendido'}
            </span>
          </div>
          <span className="text-xs text-gray-500">{lead.hora_chegada}</span>
        </div>
        
        <div className="space-y-2">
          <div>
            <h4 className="font-medium text-gray-900">{lead.nome}</h4>
            <p className="text-sm text-gray-600">{lead.contato}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-700 line-clamp-2">{lead.problema_relatado}</p>
          </div>
          
          {lead.pacote_escolhido && (
            <div className="bg-blue-50 p-2 rounded">
              <p className="text-xs font-medium text-blue-800">Pacote: {lead.pacote_escolhido}</p>
            </div>
          )}
          
          {lead.endereco && (
            <div className="text-xs text-gray-600">
              <span className="font-medium">Endereço:</span> {lead.endereco}
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{lead.perguntas_feitas?.length || 0} perguntas</span>
            <span>•</span>
            <span>{lead.conversa_ia?.length || 0} interações IA</span>
          </div>
        </div>
      </div>
    )
  }

  // removeu renderVendedorConfig; usamos VendedorConfigCard no map

  return (
    <ProtectedRoute>
      <FinanceLayout>
        <div className="p-6">
          <Toaster />
          
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
              <p className="text-gray-600">Gerencie serviços, distribuição e monitoramento do sistema</p>
            </div>
            <Link
              href="/admin/overview"
              className="inline-flex items-center px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 whitespace-nowrap"
            >
              Visão Geral
            </Link>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Carregando dados...</span>
            </div>
          ) : (
            <>
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Leads Disponíveis</p>
                          <p className="text-2xl font-bold text-gray-900">{serviceStats?.leads_disponiveis || 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <UserCheck className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Vendedores Online</p>
                          <p className="text-2xl font-bold text-gray-900">{vendedoresOnline.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <AlertTriangle className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Recuperação</p>
                          <p className="text-2xl font-bold text-gray-900">{leadsRecuperacao.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Vendidos</p>
                          <p className="text-2xl font-bold text-gray-900">{leadsVendidos.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vendedores Online (lista) */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-green-600" />
                        Vendedores Online ({vendedoresOnline.length})
                      </h3>
                      <button onClick={carregarDados} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded">Atualizar</button>
                    </div>
                    {vendedoresOnline.length === 0 ? (
                      <div className="text-gray-500 text-sm">Nenhum vendedor online no momento</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {vendedoresOnline.map((v) => (
                          <div key={v.id || v.login} className="flex items-center justify-between p-3 border rounded">
                            <div>
                              <div className="font-medium text-sm">{v.nome || v.login}</div>
                              <div className="text-xs text-gray-500">{v.login}</div>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <div className={`w-2 h-2 rounded-full ${v.status_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                              {v.status_online ? 'Online' : 'Offline'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Distribuição Automática Status */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-600" />
                        Distribuição Automática
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${distribuicaoAtiva ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="font-medium">
                          {distribuicaoAtiva ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={toggleDistribuicaoAutomatica}
                        className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                          distribuicaoAtiva
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {distribuicaoAtiva ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {distribuicaoAtiva ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={distribuirLeadsManualmente}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Target className="w-4 h-4" />
                        Distribuir Agora
                      </button>
                      <button
                        onClick={redistribuirFila}
                        className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Redistribuir Fila
                      </button>
                    </div>
                          </div>

                  {/* FileWatcher Status */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Status do FileWatcher</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          fileWatcherStatus === 'running' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className="font-medium">
                          {fileWatcherStatus === 'running' ? 'Ativo' : 'Parado'}
                            </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleFileWatcher('start')}
                          disabled={fileWatcherStatus === 'running'}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Iniciar
                        </button>
                        <button
                          onClick={() => toggleFileWatcher('stop')}
                          disabled={fileWatcherStatus === 'stopped'}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Pause className="w-4 h-4" />
                          Parar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Leads Tab */}
              {activeTab === 'leads' && (
                <div className="space-y-6">
                  {/* Recuperação */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        Leads de Recuperação ({leadsRecuperacao.length})
                      </h3>
                      <span className="text-sm text-orange-600 font-medium">Rec: true</span>
                    </div>
                    
                    {leadsRecuperacao.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                        {leadsRecuperacao.map((lead) => renderLeadCard(lead, 'recuperacao'))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>Nenhum lead de recuperação encontrado</p>
                      </div>
                            )}
                          </div>

                  {/* Vendidos */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        Leads Vendidos ({leadsVendidos.length})
                      </h3>
                      <span className="text-sm text-green-600 font-medium">Rec: false</span>
                    </div>
                    
                    {leadsVendidos.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                        {leadsVendidos.map((lead) => renderLeadCard(lead, 'vendido'))}
                        </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>Nenhum lead vendido encontrado</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Distribution Tab */}
              {activeTab === 'distribution' && (
                <div className="space-y-6">
                  {/* Preview de Distribuição */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Pré-visualização de Distribuição</h3>
                      <div className="text-sm text-gray-600">Leads disponíveis (pasta): {leadsRecuperacao.length + leadsVendidos.length}</div>
                    </div>
                    {(() => {
                      const total = leadsRecuperacao.length + leadsVendidos.length
                      const onlineIds = new Set(vendedoresOnline.filter(v => v.status_online).map(v => v.id))
                      const ativos = (configuracoesDistribuicao || []).filter(c => onlineIds.has(c.vendedor_id) && c.porcentagem > 0)
                      const soma = ativos.reduce((s, c) => s + (c.porcentagem || 0), 0)
                      const norm = soma > 0 ? ativos.map(c => ({ ...c, pct: (c.porcentagem / soma) * 100 })) : []
                      const linhas = norm.map(c => ({
                        id: c.vendedor_id,
                        nome: c.vendedor_nome,
                        pct: Math.round(c.pct),
                        previsto: Math.round(total * (c.pct / 100))
                      }))
                      return (
                        <>
                          {soma !== 100 && soma > 0 && (
                            <div className="mb-3 text-xs text-amber-600">Aviso: Soma das porcentagens (apenas online) = {soma}% (pré-visualização normaliza para 100%)</div>
                          )}
                          {linhas.length === 0 ? (
                            <div className="text-sm text-gray-500">Nenhum vendedor online com porcentagem configurada.</div>
                          ) : (
                            <div className="space-y-2">
                              {linhas.map(l => (
                                <div key={l.id} className="flex items-center justify-between p-2 border rounded">
                                  <div className="text-sm font-medium">{l.nome}</div>
                                  <div className="text-xs text-gray-600">{l.pct}%</div>
                                  <div className="text-sm">Previsto: <span className="font-semibold">{l.previsto}</span></div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )
                    })()}
                </div>

                  {/* Status da Distribuição */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-600" />
                        Distribuição Automática
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${distribuicaoAtiva ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="font-medium">
                          {distribuicaoAtiva ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={toggleDistribuicaoAutomatica}
                        className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                          distribuicaoAtiva
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {distribuicaoAtiva ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {distribuicaoAtiva ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={distribuirLeadsManualmente}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Target className="w-4 h-4" />
                        Distribuir Agora
                      </button>
                      <button
                        onClick={redistribuirFila}
                        className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Redistribuir Fila
                      </button>
                    </div>
                  </div>

                  {/* Configuração dos Vendedores */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 justify-between">
                      <Percent className="w-5 h-5 text-blue-600" />
                      <span>Configuração de Distribuição por Vendedor</span>
                      <button
                        onClick={carregarDados}
                        className="ml-auto px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                        title="Atualizar vendedores online"
                      >
                        Atualizar
                      </button>
                    </h3>
                    
                    {(vendedoresOnline.filter(v => !onlyOnline || v.status_online).length) > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {vendedoresOnline
                          .filter(v => !onlyOnline || v.status_online)
                          .map((vendedor) => (
                            <VendedorConfigCard
                              key={vendedor.id}
                              vendedor={vendedor}
                              config={configuracoesDistribuicao.find(c => c.vendedor_id === vendedor.id)}
                              presenceSeconds={presenceStats[vendedor.id] || 0}
                              hbSeconds={(vendedor as any)._hbSec}
                              onSave={(pct, tipo) => atualizarConfiguracaoVendedor(vendedor.id, pct, tipo)}
                            />
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <UserCheck className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>Nenhum vendedor online encontrado</p>
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-3">
                      <label className="text-sm text-gray-700 flex items-center gap-2">
                        <input type="checkbox" checked={onlyOnline} onChange={(e)=>setOnlyOnline(e.target.checked)} /> Somente online
                      </label>
                      <button onClick={carregarDados} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded">Atualizar</button>
                    </div>
                  </div>

                  {/* Estatísticas de Distribuição */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Estatísticas de Distribuição</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600">{distributionStats?.total || 0}</p>
                        <p className="text-sm text-gray-600">Total Distribuído</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">{distributionStats?.automatica || 0}</p>
                        <p className="text-sm text-gray-600">Automática</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-orange-600">{distributionStats?.manual || 0}</p>
                        <p className="text-sm text-gray-600">Manual</p>
                      </div>
                    </div>
                  </div>

                  {distributionStats?.porVendedor && Object.keys(distributionStats.porVendedor).length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold mb-4">Distribuição por Vendedor</h3>
                      <div className="space-y-3">
                        {Object.entries(distributionStats.porVendedor).map(([vendedor, quantidade]) => (
                          <div key={vendedor} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium">{vendedor}</span>
                            <span className="text-lg font-bold text-blue-600">{quantidade}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Services Tab */}
              {activeTab === 'services' && (
                <div className="space-y-6">
                  {/* LeadsService */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-600" />
                      LeadsService
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Leads Disponíveis</p>
                        <p className="text-xl font-bold">{serviceStats?.leads_disponiveis || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Vendedores Online</p>
                        <p className="text-xl font-bold">{serviceStats?.vendedores_online || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Leads da Pasta</p>
                        <p className="text-xl font-bold">{serviceStats?.leads_da_pasta || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Leads de Recuperação</p>
                        <p className="text-xl font-bold">{serviceStats?.leads_recuperacao || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* LeadDistributor */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      LeadDistributor
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Distribuído</p>
                        <p className="text-xl font-bold">{distributionStats?.total || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Automática</p>
                        <p className="text-xl font-bold">{distributionStats?.automatica || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Manual</p>
                        <p className="text-xl font-bold">{distributionStats?.manual || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* FileWatcher */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-orange-600" />
                      FileWatcher
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Pasta Monitorada</p>
                          <p className="text-sm font-medium">{fileWatcherStats?.pastaMonitorada || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Delay Processamento</p>
                          <p className="text-sm font-medium">{fileWatcherStats?.delayProcessamento ? `${fileWatcherStats.delayProcessamento / 1000}s` : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Arquivos Processados</p>
                          <p className="text-xl font-bold">{fileWatcherStats?.arquivosProcessados || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              fileWatcherStatus === 'running' ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <span className="text-sm font-medium">
                              {fileWatcherStatus === 'running' ? 'Ativo' : 'Parado'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={processarArquivosExistentes}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Processar Arquivos Existentes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Criar Novo Usuário (Vendedor/Recuperação)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Login</label>
                        <input className="w-full border border-gray-300 rounded px-3 py-2" value={newUser.login} onChange={(e)=>setNewUser({...newUser, login: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                        <input type="password" className="w-full border border-gray-300 rounded px-3 py-2" value={newUser.senha} onChange={(e)=>setNewUser({...newUser, senha: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                        <input className="w-full border border-gray-300 rounded px-3 py-2" value={newUser.nome} onChange={(e)=>setNewUser({...newUser, nome: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" className="w-full border border-gray-300 rounded px-3 py-2" value={newUser.email} onChange={(e)=>setNewUser({...newUser, email: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nível de Acesso</label>
                        <select className="w-full border border-gray-300 rounded px-3 py-2" value={newUser.nivel_acesso} onChange={(e)=>setNewUser({...newUser, nivel_acesso: e.target.value as any})}>
                          <option value="vendedor">Vendedor</option>
                          <option value="recuperacao">Recuperação</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button onClick={criarUsuario} disabled={creating} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                        {creating ? 'Criando...' : 'Criar Usuário'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Usuários (Vendedor/Recuperação)</h3>
                    {users.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {users.map(u => (
                          <div key={u.id} className="p-4 border rounded">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${u.status_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                <span className="font-medium">{u.nome || u.login}</span>
                              </div>
                              <span className="text-xs text-gray-500">{u.nivel_acesso}</span>
                            </div>
                            <div className="text-xs text-gray-600">{u.login}</div>
                            <div className="text-xs text-gray-500">Último acesso: {u.ultimo_acesso ? new Date(u.ultimo_acesso).toLocaleString('pt-BR') : '—'}</div>
                            <div className="text-xs text-gray-500 mt-1">Hoje: {(() => { const sec = presenceStats[u.id] || 0; return sec < 60 ? `${sec}s` : `${Math.floor(sec/60)}m`; })()}</div>
                      </div>
                    ))}
                      </div>
                    ) : (
                      <div className="text-gray-500">Nenhum usuário encontrado.</div>
                    )}
                  </div>
                </div>
              )}

              {/* FileWatcher Tab */}
              {activeTab === 'filewatcher' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Controle do FileWatcher</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            fileWatcherStatus === 'running' ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <span className="font-medium">
                            Status: {fileWatcherStatus === 'running' ? 'Ativo' : 'Parado'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleFileWatcher('start')}
                            disabled={fileWatcherStatus === 'running'}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <Play className="w-4 h-4" />
                            Iniciar
                          </button>
                          <button
                            onClick={() => toggleFileWatcher('stop')}
                            disabled={fileWatcherStatus === 'stopped'}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <Pause className="w-4 h-4" />
                            Parar
                          </button>
                </div>
              </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Pasta Monitorada</p>
                          <p className="text-sm font-medium">{fileWatcherStats?.pastaMonitorada || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Delay Processamento</p>
                          <p className="text-sm font-medium">{fileWatcherStats?.delayProcessamento ? `${fileWatcherStats.delayProcessamento / 1000}s` : 'N/A'}</p>
                        </div>
                  <div>
                          <p className="text-sm text-gray-600">Arquivos Processados</p>
                          <p className="text-xl font-bold">{fileWatcherStats?.arquivosProcessados || 0}</p>
                  </div>
                  <div>
                          <p className="text-sm text-gray-600">Arquivos em Memória</p>
                          <p className="text-xl font-bold">{fileWatcherStats?.arquivosEmMemoria?.length || 0}</p>
                        </div>
                  </div>

                    <button
                        onClick={processarArquivosExistentes}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Processar Arquivos Existentes na Pasta
                    </button>
                    </div>
                  </div>

                  {fileWatcherStats?.arquivosEmMemoria && fileWatcherStats.arquivosEmMemoria.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold mb-4">Arquivos Processados</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {fileWatcherStats.arquivosEmMemoria.map((arquivo, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium">{arquivo}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </FinanceLayout>
    </ProtectedRoute>
  )
}
