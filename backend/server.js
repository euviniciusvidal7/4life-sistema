const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar utilitários
const logger = require('./src/utils/logger');
const supabase = require('./src/utils/supabase');

// Importar serviços
const FileWatcher = require('./src/services/FileWatcher');
const LeadDistributor = require('./src/services/LeadDistributor');

// Importar middleware
const authMiddleware = require('./src/middleware/auth');
const rateLimitMiddleware = require('./src/middleware/rateLimit');

// Importar rotas
const authRoutes = require('./src/routes/auth');
const leadsRoutes = require('./src/routes/leads');
const adminRoutes = require('./src/routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware básico
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://seu-dominio.com']
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002'
      ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting geral - REMOVIDO para permitir tentativas ilimitadas
// app.use(rateLimitMiddleware.general);

// Logging de requisições
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: '4Life API - Sistema de Gestão de Leads',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      systemInfo: '/api/system/info',
      auth: '/api/auth/*',
      leads: '/api/leads/*'
    },
    documentation: 'Consulte a documentação para mais informações'
  });
});

// Favicon (resposta vazia para evitar erros)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Rotas de saúde
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/system/info', (req, res) => {
  res.json({
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    supabase: {
      url: process.env.SUPABASE_URL ? 'Configurado' : 'Não configurado',
      serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurado' : 'Não configurado'
    },
    fileWatcher: {
      pastaLeads: process.env.PASTA_LEADS || 'Não configurado',
      delayProcessamento: process.env.DELAY_PROCESSAMENTO || 'Não configurado'
    },
    server: {
      port: PORT,
      nodeVersion: process.version
    }
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/admin', adminRoutes);

// Middleware de erro global
app.use((err, req, res, next) => {
  logger.error('Erro não tratado:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno'
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Inicializar serviços
let fileWatcher, leadDistributor;

async function initializeServices() {
  try {
    // Testar conexão com Supabase
    const connectionTest = await supabase.testConnection();
    if (!connectionTest.success) {
      logger.error('Falha na conexão com Supabase:', connectionTest.error);
      process.exit(1);
    }
    logger.info('✅ Conexão com Supabase estabelecida');

    // Inicializar FileWatcher
    fileWatcher = new FileWatcher();
    await fileWatcher.iniciar();
    logger.info('✅ FileWatcher iniciado');

    // Inicializar LeadDistributor
    leadDistributor = new LeadDistributor();
    logger.info('✅ LeadDistributor iniciado');

  } catch (error) {
    logger.error('Erro ao inicializar serviços:', error);
    process.exit(1);
  }
}

// Iniciar servidor
async function startServer() {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔍 System info: http://localhost:${PORT}/api/system/info`);
    });

  } catch (error) {
    logger.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM recebido, encerrando servidor...');
  
  if (fileWatcher) {
    await fileWatcher.stop();
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT recebido, encerrando servidor...');
  
  if (fileWatcher) {
    await fileWatcher.stop();
  }
  
  process.exit(0);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  logger.error('Erro não capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promise rejeitada não tratada:', reason);
  process.exit(1);
});

// Iniciar aplicação
startServer();
