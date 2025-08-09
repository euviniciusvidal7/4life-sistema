const express = require('express');
const router = express.Router();
const LeadsService = require('../services/LeadsService');
const { authRoutes } = require('../middleware/auth');
const logger = require('../utils/logger');
const supabase = require('../utils/supabase');
const { addVendorClient, removeVendorClient, notifyLeadAssigned } = require('../utils/eventBus');
const jwt = require('jsonwebtoken');
const trello = require('../utils/trello');

const leadsService = new LeadsService();

// SSE para vendedor: eventos de lead
router.get('/events', async (req, res) => {
  try {
    // EventSource não envia Authorization header; aceitar token por query string
    const authHeader = req.headers.authorization?.replace('Bearer ', '')
    const token = authHeader || req.query.token
    if (!token) {
      return res.status(401).end()
    }
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (e) {
      return res.status(401).end()
    }

    const userId = decoded.id

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    const keepAlive = setInterval(() => { try { res.write(': keep-alive\n\n') } catch (_) {} }, 25000)
    addVendorClient(userId, res)
    req.on('close', () => { clearInterval(keepAlive); removeVendorClient(userId, res) })

    // Saudação inicial
    res.write('event: hello\n')
    res.write(`data: ${JSON.stringify({ ok: true, ts: new Date().toISOString() })}\n\n`)
  } catch (e) {
    return res.status(500).end()
  }
});

// Rota para buscar leads disponíveis e vendedores online
router.get('/dashboard', authRoutes, async (req, res) => {
    try {
        logger.info('📊 Buscando dados do dashboard...');

        // Buscar dados em paralelo
        const [leadsDisponiveis, vendedoresOnline, leadsDaPasta, estatisticas] = await Promise.all([
            leadsService.getLeadsDisponiveis(),
            leadsService.getVendedoresOnline(),
            leadsService.getLeadsDaPasta(),
            leadsService.getEstatisticas()
        ]);

        const dados = {
            leads_disponiveis: leadsDisponiveis,
            vendedores_online: vendedoresOnline,
            leads_da_pasta: leadsDaPasta,
            estatisticas: estatisticas,
            timestamp: new Date().toISOString()
        };

        logger.info(`✅ Dashboard: ${leadsDisponiveis.length} leads, ${vendedoresOnline.length} vendedores online`);
        
        res.json({
            success: true,
            data: dados
        });

    } catch (error) {
        logger.error('❌ Erro ao buscar dados do dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Rota para buscar apenas leads disponíveis
router.get('/disponiveis', authRoutes, async (req, res) => {
    try {
        const leads = await leadsService.getLeadsDisponiveis();
        
        res.json({
            success: true,
            data: leads
        });

    } catch (error) {
        logger.error('❌ Erro ao buscar leads disponíveis:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Rota para buscar vendedores online
router.get('/vendedores-online', authRoutes, async (req, res) => {
    try {
        const vendedores = await leadsService.getVendedoresOnline();
        
        res.json({
            success: true,
            data: vendedores
        });

    } catch (error) {
        logger.error('❌ Erro ao buscar vendedores online:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Rota para buscar leads da pasta local
router.get('/pasta', authRoutes, async (req, res) => {
    try {
        const leads = await leadsService.getLeadsDaPasta();
        
        res.json({
            success: true,
            data: leads
        });

    } catch (error) {
        logger.error('❌ Erro ao buscar leads da pasta:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Rota para estatísticas
router.get('/estatisticas', authRoutes, async (req, res) => {
    try {
        const estatisticas = await leadsService.getEstatisticas();
        
        res.json({
            success: true,
            data: estatisticas
        });

    } catch (error) {
        logger.error('❌ Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Confirmar lead (vendedor logado)
router.post('/confirmar', authRoutes, async (req, res) => {
  try {
    const vendedorId = req.user.id;
    const { leadId } = req.body;
    if (!leadId) return res.status(400).json({ error: 'leadId é obrigatório' });

    // Verificar propriedade do lead (ou permitir se distribuído para ele)
    const { data: lead } = await supabase.supabase
      .from('leads')
      .select('id, vendedor_id, status')
      .eq('id', leadId)
      .single();

    if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });
    if (lead.vendedor_id && lead.vendedor_id !== vendedorId) {
      return res.status(403).json({ error: 'Você não pode confirmar um lead de outro vendedor' });
    }

    // Atualizar lead para status 'novo_cliente' e associar vendedor
    const { error: updErr } = await supabase.supabase
      .from('leads')
      .update({ status: 'novo_cliente', vendedor_id: vendedorId, data_confirmacao: new Date().toISOString() })
      .eq('id', leadId);
    if (updErr) return res.status(500).json({ error: 'Erro ao atualizar lead' });

    // Inserir em novos_clientes
    const { error: insErr } = await supabase.supabase
      .from('novos_clientes')
      .insert([{ lead_id: leadId, vendedor_id: vendedorId }]);
    if (insErr) return res.status(500).json({ error: 'Erro ao registrar novo cliente' });

    // Enviar para Trello (opcional, se configurado)
    try {
      const { data: fullLead } = await supabase.supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
      const { data: vendedor } = await supabase.supabase
        .from('user_profiles')
        .select('id, login, nome_completo')
        .eq('id', vendedorId)
        .single();

      const payload = trello.buildCardPayloadFromLead({ ...fullLead, arquivo_original: fullLead?.arquivo_original }, vendedor);
      await trello.createCard({ name: payload.name, desc: payload.desc, listId: process.env.TRELLO_LIST_CONFIRMADOS });
    } catch (e) {
      // Logar e seguir; não bloquear confirmação
    }

    res.json({ success: true });
  } catch (e) {
    logger.error('Erro ao confirmar lead:', e);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Mover lead para lixeira (visível a todos para repescagem)
router.post('/lixeira', authRoutes, async (req, res) => {
  try {
    const vendedorId = req.user.id;
    const { leadId } = req.body;
    if (!leadId) return res.status(400).json({ error: 'leadId é obrigatório' });

    const { data: lead } = await supabase.supabase
      .from('leads')
      .select('id, vendedor_id, status')
      .eq('id', leadId)
      .single();

    if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });
    if (lead.vendedor_id && lead.vendedor_id !== vendedorId) {
      return res.status(403).json({ error: 'Você não pode mover para lixeira um lead de outro vendedor' });
    }

    const { error: updErr } = await supabase.supabase
      .from('leads')
      .update({ status: 'lixeira', vendedor_id: vendedorId, updated_at: new Date().toISOString() })
      .eq('id', leadId);
    if (updErr) return res.status(500).json({ error: 'Erro ao mover lead para lixeira' });

    res.json({ success: true });
  } catch (e) {
    logger.error('Erro ao mover lead para lixeira:', e);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar leads do vendedor logado
// Query: status=distribuido|novo_cliente (default distribuido), tipo=recuperacao|vendido (opcional)
router.get('/meus', authRoutes, async (req, res) => {
  try {
    const vendedorId = req.user.id;
    const status = (req.query.status || 'distribuido').toString();
    const tipo = req.query.tipo?.toString(); // recuperacao|vendido

    let query = supabase.supabase
      .from('leads')
      .select('*')
      .eq('vendedor_id', vendedorId)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(200)

    if (tipo === 'recuperacao') {
      query = query.eq('rec', true)
    } else if (tipo === 'vendido') {
      query = query.eq('rec', false)
    }

    const { data, error } = await query

    if (error) return res.status(500).json({ error: 'Erro ao listar leads' })

    res.json({ success: true, leads: data || [] })
  } catch (e) {
    logger.error('Erro em GET /meus:', e)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Listar lixeira (todos podem ver para repescagem)
router.get('/lixeira', authRoutes, async (req, res) => {
  try {
    const { data, error } = await supabase.supabase
      .from('leads')
      .select('*')
      .eq('status', 'lixeira')
      .order('updated_at', { ascending: false })
      .limit(200)

    if (error) return res.status(500).json({ error: 'Erro ao listar lixeira' })

    res.json({ success: true, leads: data || [] })
  } catch (e) {
    logger.error('Erro em GET /lixeira:', e)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

module.exports = router;
