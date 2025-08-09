const { createClient } = require('@supabase/supabase-js');
const logger = require('./logger');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

// Criar cliente Supabase com SERVICE_ROLE_KEY para acesso total
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Função para testar conexão
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      logger.error('❌ Erro ao conectar com Supabase:', error);
      return { success: false, error: error.message };
    }
    
    logger.info('✅ Conexão com Supabase estabelecida');
    return { success: true };
  } catch (error) {
    logger.error('❌ Erro ao testar conexão:', error);
    return { success: false, error: error.message };
  }
}

// Função para verificar se tabela existe
async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      logger.error(`❌ Tabela ${tableName} não encontrada:`, error);
      return false;
    }
    
    logger.info(`✅ Tabela ${tableName} encontrada`);
    return true;
  } catch (error) {
    logger.error(`❌ Erro ao verificar tabela ${tableName}:`, error);
    return false;
  }
}

// Função para criar usuário com perfil
async function createUserWithProfile(userData) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{
        login: userData.login,
        senha: userData.senha, // Deve ser hash em produção
        nivel_acesso: userData.nivel_acesso || 'vendedor',
        nome_completo: userData.nome || userData.login,
        email: userData.email || `${userData.login}@4life.com`,
        online: false,
        ultimo_acesso: new Date().toISOString()
      }])
      .select();
    
    if (error) {
      logger.error('❌ Erro ao criar usuário:', error);
      return { success: false, error: error.message };
    }
    
    logger.info('✅ Usuário criado com sucesso:', data[0]);
    return { success: true, user: data[0] };
  } catch (error) {
    logger.error('❌ Erro ao criar usuário:', error);
    return { success: false, error: error.message };
  }
}

// Função para buscar vendedores online
async function getOnlineVendedores() {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('nivel_acesso', 'vendedor')
      .eq('online', true);
    
    if (error) {
      logger.error('❌ Erro ao buscar vendedores online:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    logger.error('❌ Erro ao buscar vendedores online:', error);
    return [];
  }
}

// Função para atualizar estatísticas do vendedor
async function updateVendedorStats(vendedorId, stats) {
  try {
    const { data, error } = await supabase
      .from('vendedor_stats')
      .upsert({
        vendedor_id: vendedorId,
        leads_distribuidos: stats.leads_distribuidos || 0,
        leads_finalizados: stats.leads_finalizados || 0,
        leads_na_lixeira: stats.leads_na_lixeira || 0,
        ultima_atualizacao: new Date().toISOString()
      });
    
    if (error) {
      logger.error('❌ Erro ao atualizar stats do vendedor:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('❌ Erro ao atualizar stats do vendedor:', error);
    return false;
  }
}

module.exports = {
  supabase,
  testConnection,
  checkTableExists,
  createUserWithProfile,
  getOnlineVendedores,
  updateVendedorStats
};
