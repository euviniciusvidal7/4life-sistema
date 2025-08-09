const { createClient } = require('@supabase/supabase-js');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class LeadsService {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        this.pastaLeads = null;
        this.inicializarPastaLeads();
    }

    inicializarPastaLeads() {
        const candidates = [];
        if (process.env.PASTA_LEADS) candidates.push(process.env.PASTA_LEADS);
        candidates.push(path.join(process.cwd(), 'leads'));
        candidates.push(path.resolve(process.cwd(), '..', 'leads'));
        const repoRoot = path.resolve(__dirname, '..', '..');
        candidates.push(path.join(repoRoot, 'leads'));

        for (const candidate of candidates) {
            try {
                // Apenas verificar/garantir existência; se não puder, tenta próximo
                fs.ensureDirSync(candidate);
                this.pastaLeads = candidate;
                logger.info(`📁 (LeadsService) Pasta de leads configurada: ${this.pastaLeads}`);
                return;
            } catch (err) {
                // tenta próxima opção
                continue;
            }
        }
        // fallback final: usar cwd/leads mesmo que não exista
        this.pastaLeads = path.join(process.cwd(), 'leads');
        logger.warn(`⚠️ (LeadsService) Nenhum caminho válido preparado, usando fallback: ${this.pastaLeads}`);
    }

    // Buscar leads disponíveis (não atribuídos)
    async getLeadsDisponiveis() {
        try {
            const { data: leads, error } = await this.supabase
                .from('leads')
                .select('*')
                .eq('status', 'disponivel')
                .order('created_at', { ascending: false });

            if (error) {
                logger.error('Erro ao buscar leads disponíveis:', error);
                return [];
            }

            return leads || [];
        } catch (error) {
            logger.error('Erro no serviço de leads:', error);
            return [];
        }
    }

    // Buscar vendedores online (toggle + heartbeat <= 2 min)
    async getVendedoresOnline() {
        try {
            const doisMinAtras = new Date(Date.now() - 2 * 60 * 1000).toISOString()
            const { data: perfis, error } = await this.supabase
                .from('user_profiles')
                .select('id, login, nome_completo, nivel_acesso, ultimo_acesso, online')
                .in('nivel_acesso', ['vendedor', 'recuperacao', 'vendas'])
                .eq('online', true)
                .gte('ultimo_acesso', doisMinAtras)
                .order('ultimo_acesso', { ascending: false });

            if (error) {
                logger.error('Erro ao buscar vendedores online:', error);
                return [];
            }

            const usuarios = (perfis || []).map(p => ({
                id: p.id,
                login: p.login,
                nome: p.nome_completo || p.login,
                nivel_acesso: p.nivel_acesso,
                ultimo_acesso: p.ultimo_acesso,
                online: p.online
            }))

            return usuarios;
        } catch (error) {
            logger.error('Erro ao buscar vendedores online:', error);
            return [];
        }
    }

    // Buscar leads da pasta local (arquivos JSON)
    async getLeadsDaPasta() {
        try {
            // Revalidar pasta antes de ler (evita apontar para diretórios errados)
            this.inicializarPastaLeads();
            const leads = [];
            const arquivos = await fs.readdir(this.pastaLeads);
            const arquivosJson = arquivos.filter(arquivo => arquivo.endsWith('.json'));

            for (const arquivo of arquivosJson) {
                try {
                    const filePath = path.join(this.pastaLeads, arquivo);
                    const conteudo = await fs.readJson(filePath);
                    
                    // Formatar dados do lead
                    const recFlag = (typeof conteudo.rec === 'boolean') ? conteudo.rec : (typeof conteudo.Rec === 'boolean' ? conteudo.Rec : false)
                    const leadFormatado = {
                        arquivo: arquivo,
                        nome: conteudo.NOME || 'N/A',
                        contato: conteudo.CONTATO || 'N/A',
                        problema_relatado: conteudo.PROBLEMA_RELATADO || 'N/A',
                        rec: recFlag,
                        timestamp: conteudo.timestamp || conteudo.criado_em || new Date().toISOString(),
                        hora_chegada: this.formatarHora(conteudo.timestamp || conteudo.criado_em),
                        tipo: recFlag ? 'Recuperação' : 'Venda',
                        status: 'disponivel',
                        perguntas_feitas: conteudo.PERGUNTAS_FEITAS || [],
                        conversa_ia: conteudo.CONVERSA_IA || [],
                        pacote_escolhido: conteudo.PACOTE_ESCOLHIDO || null,
                        endereco: conteudo.ENDEREÇO || null
                    };

                    leads.push(leadFormatado);
                } catch (error) {
                    logger.error(`Erro ao ler arquivo ${arquivo}:`, error);
                }
            }

            // Ordenar por timestamp (mais recentes primeiro)
            return leads.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (error) {
            logger.error('Erro ao buscar leads da pasta:', error);
            return [];
        }
    }

    // Formatar hora de chegada
    formatarHora(timestamp) {
        try {
            if (!timestamp) return 'N/A';
            
            const data = new Date(timestamp);
            if (isNaN(data.getTime())) {
                // Tentar converter timestamp Unix
                const dataUnix = new Date(parseInt(timestamp) * 1000);
                if (!isNaN(dataUnix.getTime())) {
                    return dataUnix.toLocaleString('pt-BR');
                }
                return 'N/A';
            }
            
            return data.toLocaleString('pt-BR');
        } catch (error) {
            return 'N/A';
        }
    }

    // Buscar estatísticas gerais
    async getEstatisticas() {
        try {
            const leadsDisponiveis = await this.getLeadsDisponiveis();
            const vendedoresOnline = await this.getVendedoresOnline();
            const leadsDaPasta = await this.getLeadsDaPasta();

            return {
                leads_disponiveis: leadsDisponiveis.length,
                vendedores_online: vendedoresOnline.length,
                leads_da_pasta: leadsDaPasta.length,
                leads_recuperacao: leadsDaPasta.filter(l => l.rec).length,
                leads_venda: leadsDaPasta.filter(l => !l.rec).length
            };
        } catch (error) {
            logger.error('Erro ao buscar estatísticas:', error);
            return {
                leads_disponiveis: 0,
                vendedores_online: 0,
                leads_da_pasta: 0,
                leads_recuperacao: 0,
                leads_venda: 0
            };
        }
    }
}

module.exports = LeadsService;
