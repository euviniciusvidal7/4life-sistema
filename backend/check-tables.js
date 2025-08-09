require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkTables() {
    console.log('🔍 Verificando estrutura das tabelas...');
    
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Verificar se a tabela user_profiles existe
        const { data: userProfiles, error: userError } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(1);

        if (userError) {
            console.log('❌ Tabela user_profiles não existe ou não foi criada corretamente');
            console.log('Erro:', userError.message);
            console.log('\n💡 Execute o schema.sql no Supabase Dashboard primeiro!');
            return;
        }

        console.log('✅ Tabela user_profiles existe');

        // Verificar estrutura da tabela user_profiles
        const { data: structure, error: structureError } = await supabase
            .rpc('get_table_columns', { table_name: 'user_profiles' });

        if (structureError) {
            console.log('⚠️  Não foi possível verificar a estrutura completa');
            console.log('Mas a tabela existe, vamos tentar criar o admin...');
            
            // Tentar criar admin mesmo assim
            await createAdmin();
            return;
        }

        console.log('📋 Estrutura da tabela user_profiles:');
        console.log(structure);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

async function createAdmin() {
    console.log('\n👤 Tentando criar usuário admin...');
    
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        const bcrypt = require('bcryptjs');

        // Dados do admin (sem email por enquanto)
        const adminData = {
            login: 'admin',
            senha: await bcrypt.hash('admin123', 10),
            nivel_acesso: 'admin',
            nome_completo: 'Administrador 4Life',
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
            console.log('\n💡 Possíveis soluções:');
            console.log('1. Execute o schema.sql completo no Supabase Dashboard');
            console.log('2. Verifique se todas as colunas foram criadas corretamente');
            return;
        }

        console.log('✅ Usuário admin criado com sucesso!');
        console.log('📋 Credenciais de acesso:');
        console.log('👤 Login: admin');
        console.log('🔑 Senha: admin123');
        console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

checkTables();
