require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testUserProfiles() {
    console.log('🔍 Testando tabela user_profiles...');
    
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Testar se a tabela existe
        console.log('\n1️⃣ Testando se a tabela user_profiles existe...');
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(1);

        if (error) {
            console.log('❌ Tabela user_profiles não existe:', error.message);
            console.log('💡 Execute o SQL fornecido no Supabase Dashboard primeiro!');
            return;
        }

        console.log('✅ Tabela user_profiles existe!');
        
        if (data && data.length > 0) {
            console.log('📋 Colunas disponíveis:', Object.keys(data[0]));
        } else {
            console.log('📋 Tabela vazia, mas estrutura correta');
        }

        // Tentar criar o admin
        console.log('\n2️⃣ Criando usuário admin...');
        await createAdmin();

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

async function createAdmin() {
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        const bcrypt = require('bcryptjs');

        // Dados do admin
        const adminData = {
            login: 'admin',
            senha: await bcrypt.hash('admin123', 10),
            nivel_acesso: 'admin',
            nome_completo: 'Administrador 4Life',
            email: 'admin@4life.com',
            telefone: '(11) 99999-9999',
            online: false
        };

        // Inserir admin
        const { data, error } = await supabase
            .from('user_profiles')
            .insert([adminData])
            .select();

        if (error) {
            console.error('❌ Erro ao criar admin:', error.message);
            return;
        }

        console.log('✅ Usuário admin criado com sucesso!');
        console.log('📋 Credenciais de acesso:');
        console.log('👤 Login: admin');
        console.log('🔑 Senha: admin123');
        console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');

        // Verificar se todas as tabelas estão funcionando
        console.log('\n3️⃣ Verificando todas as tabelas...');
        await checkAllTables();

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

async function checkAllTables() {
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const tables = ['user_profiles', 'leads', 'lead_distribuicoes', 'vendedor_stats'];

        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);

                if (error) {
                    console.log(`❌ ${table}: ${error.message}`);
                } else {
                    console.log(`✅ ${table}: OK`);
                }
            } catch (err) {
                console.log(`❌ ${table}: ${err.message}`);
            }
        }

        console.log('\n🎉 Configuração do banco de dados concluída!');
        console.log('💡 Próximo passo: Implementar o FileWatcher');

    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

testUserProfiles();
