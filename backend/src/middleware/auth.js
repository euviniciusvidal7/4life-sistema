const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const supabase = require('../utils/supabase');

// Verificar token JWT
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Token inválido:', error);
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// Verificar perfil do usuário no Supabase
async function verifyUserProfile(req, res, next) {
  try {
    const { data, error } = await supabase.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();
    
    if (error || !data) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    
    req.userProfile = data;
    
    // Atualizar apenas último acesso (não alterar status_online automaticamente)
    await supabase.supabase
      .from('user_profiles')
      .update({ 
        ultimo_acesso: new Date().toISOString()
      })
      .eq('id', req.user.id);
    
    next();
  } catch (error) {
    logger.error('Erro ao verificar perfil:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Verificar nível de acesso
function requireAccessLevel(requiredLevel) {
  return (req, res, next) => {
    const userLevel = req.userProfile?.nivel_acesso;
    
    if (!userLevel) {
      return res.status(403).json({ error: 'Nível de acesso não definido' });
    }
    
    const accessLevels = {
      'admin': 4,
      'admin_vendas': 3,
      'vendedor': 2,
      'recuperacao': 1
    };
    
    const userLevelNum = accessLevels[userLevel] || 0;
    const requiredLevelNum = accessLevels[requiredLevel] || 0;
    
    if (userLevelNum < requiredLevelNum) {
      return res.status(403).json({ 
        error: 'Acesso negado',
        required: requiredLevel,
        current: userLevel 
      });
    }
    
    next();
  };
}

// Middleware para rotas de autenticação
function authRoutes(req, res, next) {
  return verifyToken(req, res, () => {
    verifyUserProfile(req, res, next);
  });
}

// Middleware para rotas de leads (vendedores)
function leadsRoutes(req, res, next) {
  return verifyToken(req, res, () => {
    verifyUserProfile(req, res, () => {
      requireAccessLevel('vendedor')(req, res, next);
    });
  });
}

// Middleware para rotas administrativas
function adminRoutes(req, res, next) {
  return verifyToken(req, res, () => {
    verifyUserProfile(req, res, () => {
      requireAccessLevel('admin')(req, res, next);
    });
  });
}

module.exports = {
  verifyToken,
  verifyUserProfile,
  requireAccessLevel,
  authRoutes,
  leadsRoutes,
  adminRoutes
};
