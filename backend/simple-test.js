require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function simpleTest() {
    console.log('🔍 Teste simples de conexão e tabelas...');
    
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        console.log('✅ Cliente Supabase criado');

        // Testar cada tabela individualmente
        const tables = ['user_profiles', 'leads', 'lead_distribuicoes', 'vendedor_stats'];

        for (const table of tables) {
            try {
                console.log(`\n🔍 Testando tabela: ${table}`);
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);

                if (error) {
                    console.log(`❌ ${table}: ${error.message}`);
                } else {
                    console.log(`✅ ${table}: OK`);
                    if (data && data.length > 0) {
                        console.log(`📋 Colunas de ${table}:`, Object.keys(data[0]));
                    }
                }
            } catch (err) {
                console.log(`❌ ${table}: ${err.message}`);
            }
        }

        console.log('\n🎯 Teste concluído!');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

simpleTest();
