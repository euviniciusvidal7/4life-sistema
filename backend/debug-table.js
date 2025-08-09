require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function debugTable() {
    console.log('🔍 Debugando estrutura da tabela user_profiles...');
    
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Tentar diferentes abordagens para verificar a estrutura
        console.log('\n1️⃣ Tentando SELECT simples...');
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .limit(1);
            
            if (error) {
                console.log('❌ Erro no SELECT:', error.message);
            } else {
                console.log('✅ SELECT funcionou');
                console.log('📋 Colunas disponíveis:', Object.keys(data[0] || {}));
            }
        } catch (err) {
            console.log('❌ Erro no SELECT:', err.message);
        }

        console.log('\n2️⃣ Tentando INSERT simples...');
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .insert([{
                    nome_completo: 'Teste',
                    nivel_acesso: 'admin'
                }])
                .select();
            
            if (error) {
                console.log('❌ Erro no INSERT:', error.message);
            } else {
                console.log('✅ INSERT funcionou');
                console.log('📋 Dados inseridos:', data);
            }
        } catch (err) {
            console.log('❌ Erro no INSERT:', err.message);
        }

        console.log('\n3️⃣ Verificando se a tabela existe via SQL...');
        try {
            const { data, error } = await supabase
                .rpc('check_table_exists', { table_name: 'user_profiles' });
            
            if (error) {
                console.log('❌ Erro na verificação:', error.message);
            } else {
                console.log('✅ Verificação funcionou:', data);
            }
        } catch (err) {
            console.log('❌ Erro na verificação:', err.message);
        }

        console.log('\n💡 Baseado nos resultados, vou sugerir a próxima ação...');

    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

debugTable();
