'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Phone, 
  Clock, 
  MessageSquare, 
  RefreshCw, 
  ShoppingCart,
  Users,
  AlertCircle,
  CheckCircle,
  Eye
} from 'lucide-react';

interface Lead {
  arquivo: string;
  nome: string;
  contato: string;
  problema_relatado: string;
  rec: boolean;
  timestamp: string;
  hora_chegada: string;
  tipo: string;
  status: string;
  perguntas_feitas: string[];
  conversa_ia: any[];
  pacote_escolhido?: string;
  endereco?: string;
}

interface Vendedor {
  id: string;
  login: string;
  nome: string;
  nivel_acesso: string;
  ultimo_acesso: string;
}

interface DashboardData {
  leads_disponiveis: Lead[];
  vendedores_online: Vendedor[];
  leads_da_pasta: Lead[];
  estatisticas: {
    leads_disponiveis: number;
    vendedores_online: number;
    leads_da_pasta: number;
    leads_recuperacao: number;
    leads_venda: number;
  };
  timestamp: string;
}

export default function LeadsDisponiveis() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3001/api/leads/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar dados do dashboard');
      }

      const data = await response.json();
      setDashboardData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Atualizar dados a cada 30 segundos
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatarTelefone = (telefone: string) => {
    if (!telefone) return 'N/A';
    
    // Remover caracteres não numéricos
    const numeros = telefone.replace(/\D/g, '');
    
    if (numeros.length === 9) {
      return `${numeros.slice(0, 3)} ${numeros.slice(3, 6)} ${numeros.slice(6)}`;
    }
    
    return telefone;
  };

  const formatarProblema = (problema: string) => {
    if (!problema) return 'N/A';
    return problema.length > 100 ? `${problema.substring(0, 100)}...` : problema;
  };

  const getTipoIcon = (rec: boolean) => {
    return rec ? <RefreshCw className="w-4 h-4 text-orange-500" /> : <ShoppingCart className="w-4 h-4 text-green-500" />;
  };

  const getTipoBadge = (rec: boolean) => {
    return rec ? (
      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
        <RefreshCw className="w-3 h-3 mr-1" />
        Recuperação
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        <ShoppingCart className="w-3 h-3 mr-1" />
        Venda
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando leads...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
        <span className="text-red-600">Erro: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Vendedores Online</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardData?.estatisticas.vendedores_online || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Leads Disponíveis</p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData?.estatisticas.leads_disponiveis || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Recuperação</p>
                <p className="text-2xl font-bold text-orange-600">
                  {dashboardData?.estatisticas.leads_recuperacao || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Vendas</p>
                <p className="text-2xl font-bold text-purple-600">
                  {dashboardData?.estatisticas.leads_venda || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendedores Online */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Vendedores Online</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {dashboardData?.vendedores_online.length || 0} online
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData?.vendedores_online.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhum vendedor online no momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData?.vendedores_online.map((vendedor) => (
                <div key={vendedor.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{vendedor.nome || vendedor.login}</p>
                    <p className="text-xs text-gray-500">{vendedor.nivel_acesso}</p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leads Disponíveis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-green-600" />
              <span>Leads Disponíveis</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {dashboardData?.leads_da_pasta.length || 0} leads
              </Badge>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              className="flex items-center space-x-1"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Atualizar</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {dashboardData?.leads_da_pasta.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhum lead disponível no momento</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardData?.leads_da_pasta.map((lead, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedLead(selectedLead?.arquivo === lead.arquivo ? null : lead)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="font-medium">{lead.nome}</span>
                        {getTipoBadge(lead.rec)}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>{formatarTelefone(lead.contato)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{lead.hora_chegada}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">
                        {formatarProblema(lead.problema_relatado)}
                      </p>
                      
                      {lead.pacote_escolhido && (
                        <div className="flex items-center space-x-1 mb-2">
                          <ShoppingCart className="w-3 h-3 text-green-600" />
                          <span className="text-sm text-green-600 font-medium">
                            {lead.pacote_escolhido}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Ver</span>
                    </Button>
                  </div>
                  
                  {/* Detalhes expandidos */}
                  {selectedLead?.arquivo === lead.arquivo && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Endereço:</h4>
                        <p className="text-sm text-gray-600">{lead.endereco || 'N/A'}</p>
                      </div>
                      
                      {lead.perguntas_feitas.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Perguntas Feitas ({lead.perguntas_feitas.length}):</h4>
                          <div className="space-y-1">
                            {lead.perguntas_feitas.slice(0, 3).map((pergunta, idx) => (
                              <p key={idx} className="text-sm text-gray-600">• {pergunta}</p>
                            ))}
                            {lead.perguntas_feitas.length > 3 && (
                              <p className="text-sm text-gray-500">... e mais {lead.perguntas_feitas.length - 3} perguntas</p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {lead.conversa_ia.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Conversa IA ({lead.conversa_ia.length} mensagens):</h4>
                          <div className="space-y-1">
                            {lead.conversa_ia.slice(0, 2).map((msg, idx) => (
                              <div key={idx} className="text-sm">
                                <p className="text-gray-600 font-medium">P: {msg.pergunta}</p>
                                <p className="text-gray-500 text-xs">R: {msg.resposta.substring(0, 100)}...</p>
                              </div>
                            ))}
                            {lead.conversa_ia.length > 2 && (
                              <p className="text-sm text-gray-500">... e mais {lead.conversa_ia.length - 2} mensagens</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
