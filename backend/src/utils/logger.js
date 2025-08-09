const winston = require('winston');
const path = require('path');

// Configurar formatos
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Criar logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        // Arquivo de erros
        new winston.transports.File({
            filename: path.join(process.env.LOG_FILE_PATH || 'logs', 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Arquivo de logs combinados
        new winston.transports.File({
            filename: path.join(process.env.LOG_FILE_PATH || 'logs', 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Arquivo específico para leads
        new winston.transports.File({
            filename: path.join(process.env.LOG_FILE_PATH || 'logs', 'leads.log'),
            level: 'info',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// Adicionar console em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// Métodos específicos para leads
logger.leadProcessed = (data) => {
    logger.info('LEAD_PROCESSED', data);
};

logger.leadDistributed = (data) => {
    logger.info('LEAD_DISTRIBUTED', data);
};

logger.leadTrashed = (data) => {
    logger.warn('LEAD_TRASHED', data);
};

logger.leadRepescado = (data) => {
    logger.info('LEAD_REPESCADO', data);
};

// Métricas simples
logger.metrics = {
    leadsProcessed: 0,
    leadsDistributed: 0,
    leadsTrashed: 0,
    errors: 0
};

logger.incrementMetric = (metric) => {
    if (logger.metrics[metric] !== undefined) {
        logger.metrics[metric]++;
    }
};

module.exports = logger;
