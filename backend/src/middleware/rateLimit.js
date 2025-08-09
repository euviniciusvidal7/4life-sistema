const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Rate limiting geral
const general = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // máximo 100 requisições
  message: {
    error: 'Muitas requisições, tente novamente mais tarde',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'Muitas requisições, tente novamente mais tarde',
      retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
    });
  }
});

// Rate limiting para autenticação
const auth = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas de login
  message: {
    error: 'Muitas tentativas de login, tente novamente em 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit de autenticação excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'Muitas tentativas de login, tente novamente em 15 minutos'
    });
  }
});

// Rate limiting para leads
const leads = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // máximo 30 requisições por minuto
  message: {
    error: 'Muitas requisições de leads, tente novamente mais tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit de leads excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'Muitas requisições de leads, tente novamente mais tarde'
    });
  }
});

// Rate limiting para distribuição
const distribution = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 distribuições por minuto
  message: {
    error: 'Muitas tentativas de distribuição, tente novamente mais tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit de distribuição excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'Muitas tentativas de distribuição, tente novamente mais tarde'
    });
  }
});

// Rate limiting para lixeira
const trash = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // máximo 20 operações de lixeira por minuto
  message: {
    error: 'Muitas operações de lixeira, tente novamente mais tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit de lixeira excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'Muitas operações de lixeira, tente novamente mais tarde'
    });
  }
});

// Rate limiting para estatísticas
const stats = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 15, // máximo 15 consultas de estatísticas por minuto
  message: {
    error: 'Muitas consultas de estatísticas, tente novamente mais tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit de estatísticas excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'Muitas consultas de estatísticas, tente novamente mais tarde'
    });
  }
});

// Rate limiting para upload
const upload = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // máximo 5 uploads por minuto
  message: {
    error: 'Muitos uploads, tente novamente mais tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit de upload excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'Muitos uploads, tente novamente mais tarde'
    });
  }
});

// Rate limiting para admin
const admin = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 50, // máximo 50 requisições admin por minuto
  message: {
    error: 'Muitas requisições administrativas, tente novamente mais tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit de admin excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'Muitas requisições administrativas, tente novamente mais tarde'
    });
  }
});

module.exports = {
  general,
  auth,
  leads,
  distribution,
  trash,
  stats,
  upload,
  admin
};
