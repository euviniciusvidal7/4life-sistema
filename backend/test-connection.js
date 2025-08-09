require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
    console.log('🔍 Testando conexão com Supabase...');
    
    try {
        // Criar cliente Supabase
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        console.log('✅ Cliente Supabase criado com sucesso');
        console.log(`📡 URL: ${process.env.SUPABASE_URL}`);

        // Testar conexão básica
        const { data, error } = await supabase
            .from('user_profiles')
            .select('count')
            .limit(1);

        if (error) {
            console.log('⚠️  Erro na consulta (pode ser normal se as tabelas não existirem ainda):');
            console.log(error.message);
        } else {
            console.log('✅ Conexão com banco de dados funcionando!');
        }

        // Verificar se as variáveis de ambiente estão corretas
        console.log('\n📋 Verificando variáveis de ambiente:');
        console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Configurado' : '❌ Não configurado'}`);
        console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurado' : '❌ Não configurado'}`);
        console.log(`SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ Não configurado'}`);

        console.log('\n🎉 Teste de conexão concluído!');
        console.log('💡 Agora você pode executar o schema.sql no Supabase Dashboard');

    } catch (error) {
        console.error('❌ Erro ao testar conexão:', error.message);
        process.exit(1);
    }
}

// Executar teste
testSupabaseConnection();
