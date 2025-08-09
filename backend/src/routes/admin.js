const express = require('express');
const logger = require('../utils/logger');
const LeadsService = require('../services/LeadsService');
const LeadDistributor = require('../services/LeadDistributor');
const FileWatcher = require('../services/FileWatcher');
const supabase = require('../utils/supabase');
const { authRoutes } = require('../middleware/auth');
const trello = require('../utils/trello');

const router = express.Router();

// Conexões SSE (presença)
const presenceClients = new Set();

// SSE: stream de presença
router.get('/events/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Pingar a cada 25s para manter conexão viva
  const keepAlive = setInterval(() => {
    try { res.write(': keep-alive\n\n'); } catch (_) {}
  }, 25000);

  presenceClients.add(res);
  req.on('close', () => {
    clearInterval(keepAlive);
    presenceClients.delete(res);
  });

  // Saudação inicial
  res.write('event: hello\n');
  res.write(`data: ${JSON.stringify({ ok: true, timestamp: new Date().toISOString() })}\n\n`);
});

function broadcastPresence(payload) {
  const data = `event: presence\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of presenceClients) {
    try { client.write(data); } catch (e) {}
  }
}

// Instâncias dos serviços
const leadsService = new LeadsService();
const leadDistributor = new LeadDistributor();
let fileWatcher = null;

// Inicializar FileWatcher se não existir
function getFileWatcher() {
  if (!fileWatcher) {
    fileWatcher = new FileWatcher();
  }
  return fileWatcher;
}

// GET /api/admin/services/stats - Estatísticas gerais dos serviços
router.get('/services/stats', async (req, res) => {
  try {
    // Estatísticas do LeadsService
    const serviceStats = await leadsService.getEstatisticas();
    
    // Estatísticas do FileWatcher
    const fileWatcherInstance = getFileWatcher();
    const fileWatcherStats = fileWatcherInstance.getEstatisticas();
    
    // Estatísticas de distribuição
    const distributionStats = await leadDistributor.getEstatisticasDistribuicao();
    
    // Status do FileWatcher
    const fileWatcherStatus = fileWatcherInstance.watcher ? 'running' : 'stopped';
    
    // Logística (Trello) em ordem: pronto_envio, em_transito, entregue_pago, devolvidos, clientes_a_ligar
    const lists = trello.getConfiguredListsInOrder();
    const logistica = [];
    for (const l of lists) {
      const { cards } = await trello.getListCards(l.id);
      logistica.push({ key: l.key, name: l.name, listId: l.id, total: (cards || []).length });
    }

    res.json({
      serviceStats,
      fileWatcherStats,
      distributionStats,
      fileWatcherStatus,
      logistica
    });
    
  } catch (error) {
    logger.error('Erro ao buscar estatísticas dos serviços:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/services/filewatcher/start - Iniciar FileWatcher
router.post('/services/filewatcher/start', async (req, res) => {
  try {
    const fileWatcherInstance = getFileWatcher();
    
    if (fileWatcherInstance.watcher) {
      return res.status(400).json({ error: 'FileWatcher já está ativo' });
    }
    
    await fileWatcherInstance.iniciar();
    logger.info('FileWatcher iniciado via API');
    
    res.json({ 
      success: true, 
      message: 'FileWatcher iniciado com sucesso' 
    });
    
  } catch (error) {
    logger.error('Erro ao iniciar FileWatcher:', error);
    res.status(500).json({ error: 'Erro ao iniciar FileWatcher' });
  }
});

// POST /api/admin/services/filewatcher/stop - Parar FileWatcher
router.post('/services/filewatcher/stop', async (req, res) => {
  try {
    const fileWatcherInstance = getFileWatcher();
    
    if (!fileWatcherInstance.watcher) {
      return res.status(400).json({ error: 'FileWatcher não está ativo' });
    }
    
    await fileWatcherInstance.parar();
    logger.info('FileWatcher parado via API');
    
    res.json({ 
      success: true, 
      message: 'FileWatcher parado com sucesso' 
    });
    
  } catch (error) {
    logger.error('Erro ao parar FileWatcher:', error);
    res.status(500).json({ error: 'Erro ao parar FileWatcher' });
  }
});

// POST /api/admin/services/process-existing - Processar arquivos existentes
router.post('/services/process-existing', async (req, res) => {
  try {
    const fileWatcherInstance = getFileWatcher();
    
    await fileWatcherInstance.processarArquivosExistentes();
    logger.info('Arquivos existentes processados via API');
    
    res.json({ 
      success: true, 
      message: 'Arquivos existentes processados com sucesso' 
    });
    
  } catch (error) {
    logger.error('Erro ao processar arquivos existentes:', error);
    res.status(500).json({ error: 'Erro ao processar arquivos existentes' });
  }
});

// GET /api/admin/services/leads/disponiveis - Leads disponíveis
router.get('/services/leads/disponiveis', async (req, res) => {
  try {
    const leads = await leadsService.getLeadsDisponiveis();
    res.json({ leads });
  } catch (error) {
    logger.error('Erro ao buscar leads disponíveis:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/services/vendedores/online - Vendedores online
router.get('/services/vendedores/online', async (req, res) => {
  try {
    const vendedores = await leadsService.getVendedoresOnline();
    res.json({ vendedores });
  } catch (error) {
    logger.error('Erro ao buscar vendedores online:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/services/leads/pasta - Leads da pasta local
router.get('/services/leads/pasta', async (req, res) => {
  try {
    const leads = await leadsService.getLeadsDaPasta();
    res.json({ leads });
  } catch (error) {
    logger.error('Erro ao buscar leads da pasta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/services/distribution/manual - Distribuição manual
router.post('/services/distribution/manual', async (req, res) => {
  try {
    const { leadId, vendedorId } = req.body;
    
    if (!leadId || !vendedorId) {
      return res.status(400).json({ error: 'leadId e vendedorId são obrigatórios' });
    }
    
    const result = await leadDistributor.distribuirLeadManualmente(leadId, vendedorId);
    
    if (result) {
      res.json({ 
        success: true, 
        message: 'Lead distribuído com sucesso',
        lead: result
      });
    } else {
      res.status(400).json({ error: 'Erro ao distribuir lead' });
    }
    
  } catch (error) {
    logger.error('Erro na distribuição manual:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/services/distribution/auto - Distribuição automática
router.post('/services/distribution/auto', async (req, res) => {
  try {
    const { leadId } = req.body;
    
    if (!leadId) {
      return res.status(400).json({ error: 'leadId é obrigatório' });
    }
    
    const result = await leadDistributor.distribuirLeadAutomaticamente(leadId);
    
    if (result) {
      res.json({ 
        success: true, 
        message: 'Lead distribuído automaticamente',
        lead: result
      });
    } else {
      res.status(400).json({ error: 'Erro ao distribuir lead automaticamente' });
    }
    
  } catch (error) {
    logger.error('Erro na distribuição automática:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/services/distribution/stats - Estatísticas de distribuição
router.get('/services/distribution/stats', async (req, res) => {
  try {
    const stats = await leadDistributor.getEstatisticasDistribuicao();
    res.json({ stats });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas de distribuição:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/distribution/config - Buscar configurações de distribuição
router.get('/distribution/config', async (req, res) => {
  try {
    // Buscar configurações (se tabela não existir, retornar vazio)
    let configuracoes = []
    try {
      const result = await supabase.supabase
        .from('distribuicao_config')
        .select('*')
        .order('vendedor_nome')
      if (result.data) configuracoes = result.data
    } catch (e) {
      logger.warn('Tabela distribuicao_config ausente ou erro ao consultar. Retornando vazio.')
    }

    // Buscar status da distribuição automática (se não existir, default false)
    let ativa = false
    try {
      const { data: statusData } = await supabase.supabase
        .from('sistema_config')
        .select('valor')
        .eq('chave', 'distribuicao_automatica')
        .single();
      ativa = statusData?.valor === 'true'
    } catch (e) {
      logger.warn('Tabela sistema_config ausente ou chave não encontrada. Usando ativa=false')
    }

    res.json({ configuracoes, ativa });

  } catch (error) {
    logger.error('Erro ao buscar configurações de distribuição:', error);
    res.status(200).json({ configuracoes: [], ativa: false });
  }
});

// POST /api/admin/distribution/config - Salvar configuração de vendedor
router.post('/distribution/config', async (req, res) => {
  try {
    const { vendedor_id, porcentagem, tipo_leads } = req.body;
    
    if (!vendedor_id || porcentagem === undefined || !tipo_leads) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Buscar informações do vendedor
    const { data: vendedor, error: vendedorError } = await supabase.supabase
      .from('user_profiles')
      .select('nome_completo')
      .eq('id', vendedor_id)
      .single();

    if (vendedorError || !vendedor) {
      return res.status(400).json({ error: 'Vendedor não encontrado' });
    }

    // Verificar se configuração já existe
    const { data: existingConfig } = await supabase.supabase
      .from('distribuicao_config')
      .select('id')
      .eq('vendedor_id', vendedor_id)
      .single();

    if (existingConfig) {
      // Atualizar configuração existente
      const { error: updateError } = await supabase.supabase
        .from('distribuicao_config')
        .update({
          porcentagem,
          tipo_leads,
          atualizado_em: new Date().toISOString()
        })
        .eq('vendedor_id', vendedor_id);

      if (updateError) {
        logger.error('Erro ao atualizar configuração:', updateError);
        return res.status(500).json({ error: 'Erro ao atualizar configuração' });
      }
    } else {
      // Criar nova configuração
      const { error: insertError } = await supabase.supabase
        .from('distribuicao_config')
        .insert([{
          vendedor_id,
          vendedor_nome: vendedor.nome_completo,
          porcentagem,
          tipo_leads,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        }]);

      if (insertError) {
        logger.error('Erro ao criar configuração:', insertError);
        return res.status(500).json({ error: 'Erro ao criar configuração' });
      }
    }

    logger.info(`Configuração atualizada para vendedor ${vendedor_id}: ${porcentagem}% - ${tipo_leads}`);
    
    res.json({ 
      success: true, 
      message: 'Configuração salva com sucesso' 
    });

  } catch (error) {
    logger.error('Erro ao salvar configuração:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/distribution/toggle - Ativar/desativar distribuição automática
router.post('/distribution/toggle', async (req, res) => {
  try {
    // Buscar status atual
    const { data: currentStatus } = await supabase.supabase
      .from('sistema_config')
      .select('valor')
      .eq('chave', 'distribuicao_automatica')
      .single();

    const novoStatus = currentStatus?.valor === 'true' ? 'false' : 'true';

    if (currentStatus) {
      // Atualizar status existente
      const { error: updateError } = await supabase.supabase
        .from('sistema_config')
        .update({ valor: novoStatus })
        .eq('chave', 'distribuicao_automatica');

      if (updateError) {
        logger.error('Erro ao atualizar status:', updateError);
        return res.status(500).json({ error: 'Erro ao atualizar status' });
      }
    } else {
      // Criar nova configuração
      const { error: insertError } = await supabase.supabase
        .from('sistema_config')
        .insert([{
          chave: 'distribuicao_automatica',
          valor: novoStatus,
          descricao: 'Status da distribuição automática de leads'
        }]);

      if (insertError) {
        logger.error('Erro ao criar configuração de status:', insertError);
        return res.status(500).json({ error: 'Erro ao criar configuração' });
      }
    }

    logger.info(`Distribuição automática ${novoStatus === 'true' ? 'ativada' : 'desativada'}`);
    
    res.json({ 
      success: true, 
      message: `Distribuição automática ${novoStatus === 'true' ? 'ativada' : 'desativada'}`,
      ativa: novoStatus === 'true'
    });

  } catch (error) {
    logger.error('Erro ao alterar status da distribuição:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/distribution/manual-batch - Distribuir leads em lote (80/20: usar configuração ponderada)
router.post('/distribution/manual-batch', async (req, res) => {
  try {
    // Garantir que arquivos da pasta foram inseridos no banco antes de distribuir
    const fileWatcherInstance = getFileWatcher();
    await fileWatcherInstance.processarArquivosExistentes();

    // 80/20: priorizar distribuição ponderada por configuração, reaproveitando a lógica já existente
    const resultado = await leadDistributor.distribuirLeadsEmLote();
    res.json({ 
      success: true, 
      message: 'Distribuição em lote concluída',
      resultado 
    });
  } catch (error) {
    logger.error('Erro na distribuição em lote:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// POST /api/admin/distribution/process-queue - Redistribuir leads em fila (aguardando)
router.post('/distribution/process-queue', async (req, res) => {
  try {
    const resultado = await leadDistributor.distribuirLeadsComStatus('aguardando');
    res.json({
      success: true,
      message: 'Redistribuição da fila concluída',
      resultado
    });
  } catch (error) {
    logger.error('Erro na redistribuição da fila:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/vendedor/toggle-online - Vendedor controla seu status online
router.post('/vendedor/toggle-online', authRoutes, async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user.id; // Vem do middleware de autenticação

    if (typeof status !== 'boolean') {
      return res.status(400).json({ 
        success: false, 
        error: 'Status deve ser true ou false' 
      });
    }

    const { data, error } = await supabase.supabase
      .from('user_profiles')
      .update({ 
        online: status,
        ultimo_acesso: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, login, nome_completo, online, ultimo_acesso')
      .single();

    if (error) {
      logger.error('Erro ao atualizar status online:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      });
    }

    // Tracking simples de sessão online (80/20)
    try {
      if (status) {
        await supabase.supabase
          .from('online_sessions')
          .insert([{ user_id: userId, started_at: new Date().toISOString() }])
      } else {
        // Encerrar a última sessão aberta
        await supabase.supabase
          .from('online_sessions')
          .update({ ended_at: new Date().toISOString() })
          .eq('user_id', userId)
          .is('ended_at', null)
      }
    } catch (e) {
      logger.warn('Falha ao registrar sessão online (tabela ausente?):', e?.message)
    }

    logger.info(`Vendedor ${data.login} ${status ? 'ativou' : 'desativou'} status online`);

    // Notificar admin em tempo real via SSE
    broadcastPresence({ userId, login: data.login, online: status, timestamp: new Date().toISOString() });
    
    res.json({ 
      success: true, 
      message: `Status online ${status ? 'ativado' : 'desativado'} com sucesso`,
      data 
    });

  } catch (error) {
    logger.error('Erro ao alternar status online:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// GET /api/admin/vendedor/status - Vendedor verifica seu status atual
router.get('/vendedor/status', authRoutes, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase.supabase
      .from('user_profiles')
      .select('id, login, nome_completo, online, ultimo_acesso, nivel_acesso')
      .eq('id', userId)
      .single();

    if (error) {
      logger.error('Erro ao buscar status do vendedor:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      });
    }

    res.json({ 
      success: true, 
      data 
    });

  } catch (error) {
    logger.error('Erro ao buscar status do vendedor:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// Estatísticas de presença (tempo online hoje)
router.get('/presenca/stats', async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const startIso = start.toISOString();

    // Buscar sessões iniciadas hoje (80/20). Sessões que começaram antes de hoje serão ignoradas nesta versão simplificada.
    const { data: sessions, error } = await supabase.supabase
      .from('online_sessions')
      .select('user_id, started_at, ended_at')
      .gte('started_at', startIso)
      .limit(2000);

    if (error) {
      return res.status(500).json({ error: 'Erro ao buscar sessões' });
    }

    // Agregar segundos por usuário
    const now = Date.now();
    const secondsByUser = new Map();

    (sessions || []).forEach((s) => {
      const startMs = new Date(s.started_at).getTime();
      const endMs = s.ended_at ? new Date(s.ended_at).getTime() : now;
      const dur = Math.max(0, Math.floor((endMs - startMs) / 1000));
      secondsByUser.set(s.user_id, (secondsByUser.get(s.user_id) || 0) + dur);
    });

    const userIds = Array.from(secondsByUser.keys());
    let profiles = [];
    if (userIds.length > 0) {
      const { data: profs } = await supabase.supabase
        .from('user_profiles')
        .select('id, login, nome_completo')
        .in('id', userIds);
      profiles = profs || [];
    }

    const result = userIds.map((uid) => {
      const prof = profiles.find((p) => p.id === uid);
      return {
        user_id: uid,
        login: prof?.login || uid,
        nome: prof?.nome_completo || prof?.login || uid,
        segundos_online_hoje: secondsByUser.get(uid) || 0,
      };
    });

    res.json({ stats: result });
  } catch (e) {
    logger.error('Erro em /presenca/stats:', e);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;


