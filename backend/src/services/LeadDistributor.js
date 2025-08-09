const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');
const { notifyLeadAssigned } = require('../utils/eventBus');

class LeadDistributor {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        this.maxLeadsPorVendedor = parseInt(process.env.MAX_LEADS_POR_VENDEDOR) || 50;
        this.distribuicaoBalanceada = process.env.DISTRIBUICAO_BALANCEADA === 'true';
        // Para evitar retorno 0 quando distribuição manual em lote é acionada, usar 0 como padrão
        this.delayMinutos = parseInt(process.env.LEAD_DISTRIB_DELAY_MINUTES || '0', 10);
    }

    async distribuirLeadAutomaticamente(leadId) {
        try {
            logger.info(`🔄 Iniciando distribuição automática para lead: ${leadId}`);

            // Respeitar atraso mínimo
            const { data: leadInfo } = await this.supabase
                .from('leads')
          .select('id, created_at, status, rec')
                .eq('id', leadId)
                .single();
            if (!leadInfo) return null;
            const threshold = new Date(Date.now() - this.delayMinutos * 60 * 1000).toISOString();
            if (leadInfo.created_at > threshold) {
                // Muito cedo para distribuir; colocar em aguardando se ainda estiver disponivel
                if (leadInfo.status === 'disponivel') {
                    await this.supabase.from('leads').update({ status: 'aguardando' }).eq('id', leadId);
                }
                return null;
            }

      // 80/20: usar a mesma lógica ponderada por configuração também na distribuição automática
      const tipo = leadInfo.rec ? 'recuperacao' : 'venda';
      const ultimoIndexRef = { index: -1 };
      let vendedorEscolhido = null;

      try {
        const { elegiveis, pesos } = await this.obterVendedoresElegiveis(tipo);
        if (elegiveis && elegiveis.length > 0) {
          vendedorEscolhido = await this.escolherVendedorPorPeso(elegiveis, pesos, ultimoIndexRef);
        }
      } catch (e) {
        // segue para fallbacks abaixo
      }

      // Fallbacks: balanceado → round-robin (aleatório)
      if (!vendedorEscolhido) {
            const vendedoresOnline = await this.getVendedoresOnline();
        if (!vendedoresOnline || vendedoresOnline.length === 0) {
                logger.warn('⚠️ Nenhum vendedor online encontrado');
                return null;
            }
        vendedorEscolhido = await this.escolherVendedor(vendedoresOnline);
            if (!vendedorEscolhido) {
                logger.warn('⚠️ Não foi possível escolher um vendedor');
                return null;
        }
            }

            // Atualizar lead com vendedor escolhido (travando condições)
            const { data: leadAtualizado, error: errorLead } = await this.supabase
                .from('leads')
                .update({
                    vendedor_id: vendedorEscolhido.id,
                    status: 'distribuido',
                    data_distribuicao: new Date().toISOString()
                })
                .eq('id', leadId)
                .is('vendedor_id', null)
                .neq('status', 'distribuido')
                .select()
                .single();

            if (errorLead || !leadAtualizado) {
                logger.error('Erro ao atualizar lead ou lead já distribuído:', errorLead);
                return null;
            }

            // Registrar distribuição
            const { error: errorDistribuicao } = await this.supabase
                .from('lead_distribuicoes')
                .insert([{
                    lead_id: leadId,
                    vendedor_id: vendedorEscolhido.id,
                    tipo_distribuicao: 'automatica',
                    algoritmo_usado: this.distribuicaoBalanceada ? 'balanceado' : 'round_robin'
                }]);

            if (errorDistribuicao) {
                logger.error('Erro ao registrar distribuição:', errorDistribuicao);
            }

            logger.leadDistributed({
                leadId,
                vendedorId: vendedorEscolhido.id,
                vendedorNome: vendedorEscolhido.nome,
                algoritmo: this.distribuicaoBalanceada ? 'balanceado' : 'round_robin'
            });

            // Notificar vendedor em tempo real
            try {
                notifyLeadAssigned(vendedorEscolhido.id, { leadId });
            } catch (_) {}

            logger.info(`✅ Lead ${leadId} distribuído para ${vendedorEscolhido.nome}`);

            return leadAtualizado;

        } catch (error) {
            logger.error('Erro na distribuição automática:', error);
            return null;
        }
    }

    async getVendedoresOnline() {
        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .select('id, login, nome_completo, nivel_acesso, ultimo_acesso, online')
                .eq('online', true)
                .in('nivel_acesso', ['vendedor', 'admin_vendas', 'vendas'])
                .gte('ultimo_acesso', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Últimos 30 minutos
                .order('ultimo_acesso', { ascending: false });

            if (error) {
                logger.error('Erro ao buscar vendedores online:', error);
                return [];
            }

            const mapped = (data || []).map((u) => ({
                ...u,
                nome: u.nome_completo || u.login
            }))
            return mapped;

        } catch (error) {
            logger.error('Erro ao buscar vendedores online:', error);
            return [];
        }
    }

    async escolherVendedor(vendedores) {
        if (vendedores.length === 0) return null;

        if (this.distribuicaoBalanceada) {
            return await this.escolherVendedorBalanceado(vendedores);
        } else {
            return this.escolherVendedorRoundRobin(vendedores);
        }
    }

    async escolherVendedorBalanceado(vendedores) {
        try {
            // Buscar estatísticas dos vendedores
            const vendedoresComStats = await Promise.all(
                vendedores.map(async (vendedor) => {
                    const { data: stats } = await this.supabase
                        .from('vendedor_stats')
                        .select('leads_recebidos')
                        .eq('vendedor_id', vendedor.id)
                        .eq('data', new Date().toISOString().split('T')[0])
                        .single();

                    return {
                        ...vendedor,
                        leadsHoje: stats?.leads_recebidos || 0
                    };
                })
            );

            // Escolher vendedor com menos leads hoje
            const vendedorEscolhido = vendedoresComStats.reduce((menor, atual) => {
                return atual.leadsHoje < menor.leadsHoje ? atual : menor;
            });

            logger.info(`📊 Distribuição balanceada: ${vendedorEscolhido.nome} (${vendedorEscolhido.leadsHoje} leads hoje)`);

            return vendedorEscolhido;

        } catch (error) {
            logger.error('Erro na distribuição balanceada:', error);
            return vendedores[0]; // Fallback para primeiro vendedor
        }
    }

    escolherVendedorRoundRobin(vendedores) {
        // Implementação simples de round-robin
        const vendedorEscolhido = vendedores[Math.floor(Math.random() * vendedores.length)];
        logger.info(`🎲 Distribuição round-robin: ${vendedorEscolhido.nome}`);
        return vendedorEscolhido;
    }

    async escolherVendedorPorPeso(vendedores, pesosMap, ultimoIndexRef) {
        const lista = vendedores.map(v => ({ id: v.id, peso: Math.max(0, Number(pesosMap[v.id] || 0)) }))
        const soma = lista.reduce((s, v) => s + v.peso, 0)
        if (soma <= 0) {
            ultimoIndexRef.index = (ultimoIndexRef.index + 1) % vendedores.length
            return vendedores[ultimoIndexRef.index]
        }
        const r = Math.random() * soma
        let acc = 0
        for (const v of lista) {
            acc += v.peso
            if (r <= acc) {
                return vendedores.find(x => x.id === v.id)
            }
        }
        return vendedores[0]
    }

    async obterVendedoresElegiveis(tipoLead) {
        // Busca config de distribuição com tipo_leads
        const { data: configs } = await this.supabase
            .from('distribuicao_config')
            .select('vendedor_id, porcentagem, tipo_leads')
            .gt('porcentagem', 0)

        const doisMinAtras = new Date(Date.now() - 2 * 60 * 1000).toISOString()
        const { data: vendedores } = await this.supabase
            .from('user_profiles')
            .select('id, login, nome, ultimo_acesso, online')
            .eq('online', true)
            .gte('ultimo_acesso', doisMinAtras)

        const confById = new Map((configs || []).map(c => [c.vendedor_id, c]))
        const elegiveis = (vendedores || []).filter(v => {
            const c = confById.get(v.id)
            if (!c) return false
            if (tipoLead === 'recuperacao' && c.tipo_leads === 'venda') return false
            if (tipoLead === 'venda' && c.tipo_leads === 'recuperacao') return false
            return true
        })
        const pesos = Object.fromEntries(elegiveis.map(v => [v.id, confById.get(v.id)?.porcentagem || 0]))

        return { elegiveis, pesos }
    }

    async distribuirLeadsComStatus(status = 'disponivel', ignorarDelay = false) {
        // Buscar leads por status
        const threshold = new Date(Date.now() - this.delayMinutos * 60 * 1000).toISOString()
        let query = this.supabase
            .from('leads')
            .select('id, rec, status, created_at')
            .eq('status', status)
            .order('created_at', { ascending: true })
            .limit(500)

        if (!ignorarDelay) {
            query = query.lte('created_at', threshold)
        }

        const { data: leads } = await query

        if (!leads || leads.length === 0) return { distribuido: 0, aguardando: 0, erros: 0 }

        const ultimoIndexRef = { index: -1 }
        let distribuido = 0
        let aguardando = 0
        let erros = 0

        for (const lead of leads) {
            try {
                const tipo = lead.rec ? 'recuperacao' : 'venda'
                const { elegiveis, pesos } = await this.obterVendedoresElegiveis(tipo)
                if (!elegiveis || elegiveis.length === 0) {
                    // mover para aguardando se não houver vendedores elegíveis
                    await this.supabase
                      .from('leads')
                      .update({ status: 'aguardando' })
                      .eq('id', lead.id)
                    aguardando++
                    continue
                }

                const escolhido = await this.escolherVendedorPorPeso(elegiveis, pesos, ultimoIndexRef)
                if (!escolhido) {
                    aguardando++
                    continue
                }

                const ok = await this.distribuirLeadManualmente(lead.id, escolhido.id)
                if (ok) distribuido++
                else erros++
            } catch (e) {
                erros++
            }
        }
        return { distribuido, aguardando, erros }
    }

    async distribuirLeadsEmLote(ignorarDelay = true) {
        return this.distribuirLeadsComStatus('disponivel', ignorarDelay)
    }

    async distribuirLeadManualmente(leadId, vendedorId) {
        try {
            logger.info(`👤 Distribuição manual: lead ${leadId} para vendedor ${vendedorId}`);

            // Verificar se vendedor existe
            const { data: vendedor, error: errorVendedor } = await this.supabase
                .from('user_profiles')
                .select('id, nome_completo')
                .eq('id', vendedorId)
                .single();

            if (errorVendedor || !vendedor) {
                logger.error('Vendedor não encontrado:', errorVendedor);
                return null;
            }

            // Atualizar lead
            const { data: leadAtualizado, error: errorLead } = await this.supabase
                .from('leads')
                .update({
                    vendedor_id: vendedorId,
                    status: 'distribuido',
                    data_distribuicao: new Date().toISOString()
                })
                .eq('id', leadId)
                .is('vendedor_id', null)
                .neq('status', 'distribuido')
                .select()
                .single();

            if (errorLead) {
                logger.error('Erro ao atualizar lead:', errorLead);
                return null;
            }

            // Registrar distribuição
            const { error: errorDistribuicao } = await this.supabase
                .from('lead_distribuicoes')
                .insert([{
                    lead_id: leadId,
                    vendedor_id: vendedorId,
                    tipo_distribuicao: 'manual',
                    algoritmo_usado: 'manual'
                }]);

            if (errorDistribuicao) {
                logger.error('Erro ao registrar distribuição manual:', errorDistribuicao);
            }

            logger.leadDistributed({
                leadId,
                vendedorId,
                vendedorNome: vendedor.nome_completo,
                algoritmo: 'manual'
            });

            // Notificar vendedor
            try {
                notifyLeadAssigned(vendedorId, { leadId });
            } catch (_) {}

            return leadAtualizado;

        } catch (error) {
            logger.error('Erro na distribuição manual:', error);
            return null;
        }
    }

    async getLeadsDisponiveis() {
        try {
            const { data, error } = await this.supabase
                .from('leads')
                .select('*')
                .eq('status', 'disponivel')
                .order('created_at', { ascending: true });

            if (error) {
                logger.error('Erro ao buscar leads disponíveis:', error);
                return [];
            }

            return data || [];

        } catch (error) {
            logger.error('Erro ao buscar leads disponíveis:', error);
            return [];
        }
    }

    async getEstatisticasDistribuicao() {
        try {
            const hoje = new Date().toISOString().split('T')[0];
            const { data, error } = await this.supabase
                .from('lead_distribuicoes')
                .select('tipo_distribuicao, algoritmo_usado, vendedor_id, data_distribuicao')
                .gte('data_distribuicao', `${hoje}T00:00:00`)
                .lte('data_distribuicao', `${hoje}T23:59:59`);
            if (error) {
                logger.error('Erro ao buscar estatísticas:', error);
                return {};
            }
            const estatisticas = {
                total: (data || []).length,
                automatica: (data || []).filter(d => d.tipo_distribuicao === 'automatica').length,
                manual: (data || []).filter(d => d.tipo_distribuicao === 'manual').length,
                porVendedor: {}
            };
            const vendedorIds = Array.from(new Set((data || []).map(d => d.vendedor_id).filter(Boolean)));
            let perfis = [];
            if (vendedorIds.length > 0) {
                const { data: perfisData } = await this.supabase
                    .from('user_profiles')
                    .select('id, nome_completo, login')
                    .in('id', vendedorIds);
                perfis = perfisData || [];
            }
            const nomeById = new Map(perfis.map(p => [p.id, p.nome_completo || p.login || p.id]));
            (data || []).forEach(distribuicao => {
                const vendedorNome = nomeById.get(distribuicao.vendedor_id) || String(distribuicao.vendedor_id);
                if (!estatisticas.porVendedor[vendedorNome]) {
                    estatisticas.porVendedor[vendedorNome] = 0;
                }
                estatisticas.porVendedor[vendedorNome]++;
            });
            return estatisticas;
        } catch (error) {
            logger.error('Erro ao buscar estatísticas de distribuição:', error);
            return {};
        }
    }
}

module.exports = LeadDistributor;
