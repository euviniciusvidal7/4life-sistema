const chokidar = require('chokidar');
const fs = require('fs-extra');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');
const LeadDistributor = require('./LeadDistributor');

class FileWatcher {
    constructor() {
        // A resolução do caminho será feita dinamicamente em ensureLeadsFolder()
        this.pastaLeads = process.env.PASTA_LEADS || path.join(process.cwd(), 'leads');
        this.delayProcessamento = parseInt(process.env.DELAY_PROCESSAMENTO) || 600000; // 10 minutos
        this.watcher = null;
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        this.leadDistributor = new LeadDistributor();
        this.processedFiles = new Set();
    }

    async iniciar() {
        try {
            // Verificar/criar pasta com fallback em caso de permissão inválida
            await this.ensureLeadsFolder();

            // Configurar o watcher
            this.watcher = chokidar.watch(this.pastaLeads, {
                ignored: /(^|[\/\\])\../, // Ignorar arquivos ocultos
                persistent: true,
                awaitWriteFinish: {
                    stabilityThreshold: 2000,
                    pollInterval: 100
                }
            });

            // Eventos do watcher
            this.watcher
                .on('add', (filePath) => this.handleNewFile(filePath))
                .on('change', (filePath) => this.handleFileChange(filePath))
                .on('unlink', (filePath) => this.handleFileDelete(filePath))
                .on('error', (error) => logger.error('Erro no FileWatcher:', error))
                .on('ready', () => {
                    logger.info('🔍 FileWatcher iniciado e monitorando pasta de leads');
                    logger.info(`⏰ Delay de processamento: ${this.delayProcessamento / 1000} segundos`);
                });

        } catch (error) {
            logger.error('Erro ao iniciar FileWatcher:', error);
            throw error;
        }
    }

    async ensureLeadsFolder() {
        // 1) Se PASTA_LEADS foi definida, exigir que exista (não criar, não fazer fallback silencioso)
        if (process.env.PASTA_LEADS) {
            const explicit = process.env.PASTA_LEADS.trim();
            const exists = await fs.pathExists(explicit);
            if (!exists) {
                const msg = `PASTA_LEADS apontada no .env não existe: ${explicit}`;
                logger.error(`❌ ${msg}`);
                throw new Error(msg);
            }
            const stat = await fs.stat(explicit);
            if (!stat.isDirectory()) {
                const msg = `PASTA_LEADS não é um diretório: ${explicit}`;
                logger.error(`❌ ${msg}`);
                throw new Error(msg);
            }
            this.pastaLeads = explicit;
            logger.info(`📁 Pasta de leads configurada: ${this.pastaLeads}`);
            return;
        }

        // 2) Descoberta automática quando não há PASTA_LEADS
        const candidates = [
            path.join(process.cwd(), 'leads'),
            path.resolve(process.cwd(), '..', 'leads'),
            path.join(path.resolve(__dirname, '..', '..', '..'), 'leads'),
        ];

        let lastError = null;
        for (const candidate of candidates) {
            try {
                await fs.ensureDir(candidate);
                this.pastaLeads = candidate;
                logger.info(`📁 Pasta de leads configurada: ${this.pastaLeads}`);
                return;
            } catch (err) {
                lastError = err;
                if (['EPERM', 'EACCES', 'EEXIST'].includes(err?.code)) {
                    logger.warn(`⚠️ Sem acesso à pasta de leads: ${candidate}. Tentando próximo caminho...`);
                    continue;
                }
            }
        }

        logger.error('❌ Nenhum caminho válido para a pasta de leads pôde ser preparado.');
        if (lastError) logger.error('Último erro:', lastError);
        throw lastError || new Error('Falha ao preparar pasta de leads');
    }

    async handleNewFile(filePath) {
        try {
            // Verificar se é um arquivo JSON
            if (!filePath.endsWith('.json')) {
                logger.info(`📄 Arquivo ignorado (não é JSON): ${path.basename(filePath)}`);
                return;
            }

            // Verificar se já foi processado
            if (this.processedFiles.has(filePath)) {
                logger.info(`🔄 Arquivo já processado: ${path.basename(filePath)}`);
                return;
            }

            logger.info(`📄 Novo arquivo detectado: ${path.basename(filePath)}`);

            // Aguardar o delay de processamento
            setTimeout(async () => {
                await this.processarLead(filePath);
            }, this.delayProcessamento);

        } catch (error) {
            logger.error('Erro ao processar novo arquivo:', error);
        }
    }

    async handleFileChange(filePath) {
        try {
            if (!filePath.endsWith('.json')) return;

            logger.info(`📝 Arquivo modificado: ${path.basename(filePath)}`);
            
            // Reprocessar após delay
            setTimeout(async () => {
                await this.processarLead(filePath);
            }, this.delayProcessamento);

        } catch (error) {
            logger.error('Erro ao processar arquivo modificado:', error);
        }
    }

    async handleFileDelete(filePath) {
        try {
            if (!filePath.endsWith('.json')) return;

            logger.info(`🗑️ Arquivo removido: ${path.basename(filePath)}`);
            this.processedFiles.delete(filePath);

        } catch (error) {
            logger.error('Erro ao processar remoção de arquivo:', error);
        }
    }

    async processarLead(filePath) {
        try {
            // Verificar se arquivo ainda existe
            if (!await fs.pathExists(filePath)) {
                logger.warn(`⚠️ Arquivo não encontrado: ${path.basename(filePath)}`);
                return;
            }

            // Ler o arquivo JSON
            const fileContent = await fs.readFile(filePath, 'utf8');
            const leadData = JSON.parse(fileContent);

            logger.info(`🔍 Processando lead: ${path.basename(filePath)}`);

            // Validar dados do lead
            const leadValidado = this.validarLead(leadData);
            if (!leadValidado) {
                logger.error(`❌ Lead inválido: ${path.basename(filePath)}`);
                return;
            }

            // Determinar tipo de lead baseado na variável 'rec'
            const tipoLead = this.determinarTipoLead(leadData);

            // Salvar lead no banco de dados
            const leadSalvo = await this.salvarLead(leadData, tipoLead, path.basename(filePath));
            if (!leadSalvo) {
                logger.error(`❌ Erro ao salvar lead: ${path.basename(filePath)}`);
                return;
            }

            // Marcar como processado
            this.processedFiles.add(filePath);

            // Log de sucesso
            logger.leadProcessed({
                arquivo: path.basename(filePath),
                nome: leadData.NOME,
                tipo: tipoLead,
                rec: leadData.rec
            });

            // Verificar toggle de distribuição automática
            let ativa = false;
            try {
                const { data: statusData } = await this.supabase
                    .from('sistema_config')
                    .select('valor')
                    .eq('chave', 'distribuicao_automatica')
                    .single();
                ativa = statusData?.valor === 'true';
            } catch (_) {}

            if (ativa) {
                await this.leadDistributor.distribuirLeadAutomaticamente(leadSalvo.id);
            } else {
                logger.info('🕒 Distribuição automática desativada. Lead mantido como disponivel.');
            }

            logger.info(`✅ Lead processado com sucesso: ${path.basename(filePath)}`);

        } catch (error) {
            logger.error(`❌ Erro ao processar lead ${path.basename(filePath)}:`, error);
        }
    }

    validarLead(leadData) {
        try {
            // Campos obrigatórios (ENDEREÇO pode não existir em alguns fluxos)
            const camposObrigatorios = ['NOME', 'CONTATO', 'PROBLEMA_RELATADO'];
            
            for (const campo of camposObrigatorios) {
                if (!leadData[campo]) {
                    logger.error(`Campo obrigatório ausente: ${campo}`);
                    return false;
                }
            }

            // Validar se 'rec' (ou 'Rec') existe como boolean
            const hasRecLower = typeof leadData.rec === 'boolean';
            const hasRecUpper = typeof leadData.Rec === 'boolean';
            if (!hasRecLower && !hasRecUpper) {
                logger.error('Campo "rec/Rec" deve ser boolean');
                return false;
            }

            return true;

        } catch (error) {
            logger.error('Erro na validação do lead:', error);
            return false;
        }
    }

    determinarTipoLead(leadData) {
        // Lógica baseada na variável 'rec' (aceitar rec ou Rec)
        const recValue = (typeof leadData.rec === 'boolean')
            ? leadData.rec
            : (typeof leadData.Rec === 'boolean' ? leadData.Rec : undefined);
        if (recValue === true) {
            return 'recuperacao';
        } else if (recValue === false) {
            return 'venda_concluida';
        } else {
            return 'novo_lead';
        }
    }

    async salvarLead(leadData, tipoLead, arquivoOriginal) {
        try {
            const leadParaSalvar = {
                nome: leadData.NOME || leadData.nome,
                endereco: leadData.ENDEREÇO || leadData.endereco,
                contato: leadData.CONTATO || leadData.contato,
                problema_relatado: leadData.PROBLEMA_RELATADO || leadData.problema_relatado,
                conversa_ia: leadData.CONVERSA_IA || leadData.conversa_ia || null,
                pacote_escolhido: leadData.PACOTE_ESCOLHIDO || leadData.pacote_escolhido || null,
                valor_final: leadData.VALOR_FINAL ? parseFloat(leadData.VALOR_FINAL) : (leadData.valor_final ? parseFloat(leadData.valor_final) : null),
                rec: (typeof leadData.rec === 'boolean') ? leadData.rec : (typeof leadData.Rec === 'boolean' ? leadData.Rec : false),
                tipo_lead: tipoLead,
                status: 'disponivel',
                arquivo_original: arquivoOriginal
            };

            const { data, error } = await this.supabase
                .from('leads')
                .insert([leadParaSalvar])
                .select()
                .single();

            if (error) {
                logger.error('Erro ao salvar lead no banco:', error);
                return null;
            }

            return data;
        } catch (error) {
            logger.error('Erro ao salvar lead:', error);
            return null;
        }
    }

    async parar() {
        try {
            if (this.watcher) {
                await this.watcher.close();
                logger.info('🛑 FileWatcher parado');
            }
        } catch (error) {
            logger.error('Erro ao parar FileWatcher:', error);
        }
    }

    // Método para processar arquivos existentes na pasta
    async processarArquivosExistentes() {
        try {
            logger.info('🔍 Verificando arquivos existentes na pasta de leads...');
            // Revalidar o caminho antes de escanear (cobre cenários onde .env mudou)
            await this.ensureLeadsFolder();
            logger.info(`📂 Pasta atual para varredura: ${this.pastaLeads}`);
            
            const arquivos = await fs.readdir(this.pastaLeads);
            const arquivosJson = arquivos.filter(arquivo => arquivo.endsWith('.json'));

            logger.info(`📄 Encontrados ${arquivosJson.length} arquivos JSON para processar`);

            for (const arquivo of arquivosJson) {
                const filePath = path.join(this.pastaLeads, arquivo);
                await this.processarLead(filePath);
            }

        } catch (error) {
            logger.error('Erro ao processar arquivos existentes:', error);
        }
    }

    // Método para obter estatísticas do FileWatcher
    getEstatisticas() {
        return {
            pastaMonitorada: this.pastaLeads,
            delayProcessamento: this.delayProcessamento,
            arquivosProcessados: this.processedFiles.size,
            arquivosEmMemoria: Array.from(this.processedFiles)
        };
    }
}

module.exports = FileWatcher;
