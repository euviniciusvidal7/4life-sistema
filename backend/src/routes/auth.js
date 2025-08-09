const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const logger = require('../utils/logger');
const supabase = require('../utils/supabase');
const rateLimitMiddleware = require('../middleware/rateLimit');

const router = express.Router();

// Rate limiting para autenticação - REMOVIDO para permitir tentativas ilimitadas
// router.use(rateLimitMiddleware.auth);

// Schema de validação para login
const loginSchema = Joi.object({
  login: Joi.string().required().min(3).max(50),
  senha: Joi.string().required().min(6).max(100)
});

// Schema de validação para criação de usuário
const createUserSchema = Joi.object({
  login: Joi.string().required().min(3).max(50),
  senha: Joi.string().required().min(6).max(100),
  nome: Joi.string().required().min(2).max(100),
  email: Joi.string().email().required(),
  nivel_acesso: Joi.string().valid('admin', 'admin_vendas', 'vendedor', 'recuperacao').default('vendedor')
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    // Validar entrada
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.details[0].message 
      });
    }

    const { login, senha } = value;

    // Buscar usuário no Supabase por login OU email
    const { data: user, error: userError } = await supabase.supabase
      .from('user_profiles')
      .select('*')
      .or(`login.eq.${login},email.eq.${login}`)
      .single();

    if (userError || !user) {
      logger.warn(`Tentativa de login falhou para usuário: ${login}`);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha (em produção, usar hash)
    if (user.senha !== senha) {
      logger.warn(`Senha incorreta para usuário: ${login}`);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        login: user.login, 
        nivel_acesso: user.nivel_acesso 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Atualizar último acesso
    await supabase.supabase
      .from('user_profiles')
      .update({ 
        ultimo_acesso: new Date().toISOString(),
        online: true 
      })
      .eq('id', user.id);

    logger.info(`Login bem-sucedido para usuário: ${login}`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        login: user.login,
        nome: user.nome || user.nome_completo || user.login,
        email: user.email,
        nivel_acesso: user.nivel_acesso
      }
    });

  } catch (error) {
    logger.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(400).json({ error: 'Token não fornecido' });
    }

    // Decodificar token para obter ID do usuário
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Atualizar status offline
    await supabase.supabase
      .from('user_profiles')
      .update({ online: false })
      .eq('id', decoded.id);

    logger.info(`Logout realizado para usuário: ${decoded.login}`);

    res.json({ success: true, message: 'Logout realizado com sucesso' });

  } catch (error) {
    logger.error('Erro no logout:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/verify
router.post('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar dados atualizados do usuário
    const { data: user, error: userError } = await supabase.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        login: user.login,
        nome: user.nome,
        email: user.email,
        nivel_acesso: user.nivel_acesso
      }
    });

  } catch (error) {
    logger.error('Erro na verificação de token:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Verificar token atual
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Gerar novo token
    const newToken = jwt.sign(
      { 
        id: decoded.id, 
        login: decoded.login, 
        nivel_acesso: decoded.nivel_acesso 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info(`Token renovado para usuário: ${decoded.login}`);

    res.json({
      success: true,
      token: newToken
    });

  } catch (error) {
    logger.error('Erro na renovação de token:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
});

// GET /api/auth/users - listar usuários por nível (somente admin/admin_vendas)
router.get('/users', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!['admin', 'admin_vendas'].includes(decoded.nivel_acesso)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // níveis permitidos via query ?nivel=vendedor,recuperacao
    const niveisParam = (req.query.nivel || 'vendedor,recuperacao').toString();
    const niveis = niveisParam.split(',').map(s => s.trim()).filter(Boolean);

    const { data, error } = await supabase.supabase
      .from('user_profiles')
      .select('id, login, nome, nome_completo, email, nivel_acesso, ultimo_acesso, online')
      .in('nivel_acesso', niveis)
      .order('ultimo_acesso', { ascending: false });

    if (error) {
      logger.error('Erro ao listar usuários:', error);
      return res.status(500).json({ error: 'Erro ao listar usuários' });
    }

    res.json({ users: data || [] });

  } catch (error) {
    logger.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/create-user (admin e admin_vendas)
router.post('/create-user', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!['admin', 'admin_vendas'].includes(decoded.nivel_acesso)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Validar entrada
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.details[0].message 
      });
    }

    // Se for admin_vendas, forçar criação como vendedor
    if (decoded.nivel_acesso === 'admin_vendas') {
      value.nivel_acesso = 'vendedor'
    }

    // Verificar se usuário já existe
    const { data: existingUser } = await supabase.supabase
      .from('user_profiles')
      .select('id')
      .eq('login', value.login)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    // Criar usuário
    const result = await supabase.createUserWithProfile(value);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    logger.info(`Usuário criado: ${value.login} por: ${decoded.login}`);

    res.json({
      success: true,
      user: result.user
    });

  } catch (error) {
    logger.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/heartbeat - atualiza último acesso (presença)
router.post('/heartbeat', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { error } = await supabase.supabase
      .from('user_profiles')
      .update({ ultimo_acesso: new Date().toISOString() })
      .eq('id', decoded.id);

    if (error) return res.status(500).json({ error: 'Erro ao atualizar presença' });

    res.json({ success: true });
  } catch (e) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

module.exports = router;
