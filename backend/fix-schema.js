require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function fixSchema() {
    console.log('🔧 Verificando e corrigindo estrutura da tabela user_profiles...');
    
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Primeiro, vamos verificar se conseguimos fazer um SELECT simples
        console.log('\n1️⃣ Testando SELECT básico...');
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .limit(1);
            
            if (error) {
                console.log('❌ Erro no SELECT:', error.message);
            } else {
                console.log('✅ SELECT funcionou');
                if (data && data.length > 0) {
                    console.log('📋 Colunas existentes:', Object.keys(data[0]));
                } else {
                    console.log('📋 Tabela vazia, mas existe');
                }
            }
        } catch (err) {
            console.log('❌ Erro no SELECT:', err.message);
        }

        // Agora vamos tentar adicionar as colunas que podem estar faltando
        console.log('\n2️⃣ Tentando adicionar colunas faltantes...');
        
        const columnsToAdd = [
            'ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS login VARCHAR(50)',
            'ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS senha VARCHAR(255)',
            'ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS nivel_acesso VARCHAR(20)',
            'ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS nome_completo VARCHAR(100)',
            'ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255)',
            'ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS telefone VARCHAR(20)',
            'ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS online BOOLEAN DEFAULT false',
            'ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS ultimo_acesso TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
        ];

        for (const columnSQL of columnsToAdd) {
            try {
                const { data, error } = await supabase.rpc('exec_sql', { 
                    sql_command: columnSQL 
                });
                
                if (error) {
                    console.log(`⚠️  ${columnSQL}: ${error.message}`);
                } else {
                    console.log(`✅ ${columnSQL.split(' ')[5]}: adicionada`);
                }
            } catch (err) {
                console.log(`⚠️  ${columnSQL.split(' ')[5]}: ${err.message}`);
            }
        }

        // Adicionar constraints se necessário
        console.log('\n3️⃣ Adicionando constraints...');
        const constraints = [
            'ALTER TABLE public.user_profiles ADD CONSTRAINT IF NOT EXISTS user_profiles_login_unique UNIQUE (login)',
            'ALTER TABLE public.user_profiles ADD CONSTRAINT IF NOT EXISTS user_profiles_email_unique UNIQUE (email)',
            'ALTER TABLE public.user_profiles ADD CONSTRAINT IF NOT EXISTS user_profiles_nivel_acesso_check CHECK (nivel_acesso IN (\'admin\', \'vendedor\', \'admin_vendas\', \'recuperacao\', \'ltv\', \'logistica\', \'vendas\'))'
        ];

        for (const constraintSQL of constraints) {
            try {
                const { data, error } = await supabase.rpc('exec_sql', { 
                    sql_command: constraintSQL 
                });
                
                if (error) {
                    console.log(`⚠️  Constraint: ${error.message}`);
                } else {
                    console.log(`✅ Constraint adicionada`);
                }
            } catch (err) {
                console.log(`⚠️  Constraint: ${err.message}`);
            }
        }

        console.log('\n4️⃣ Testando criação do admin...');
        await createAdmin();

    } catch (error) {
        console.error('❌ Erro geral:', error.message);
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
            console.log('\n💡 Vamos tentar uma abordagem alternativa...');
            
            // Tentar sem email
            const adminDataSimple = {
                login: 'admin',
                senha: await bcrypt.hash('admin123', 10),
                nivel_acesso: 'admin',
                nome_completo: 'Administrador 4Life',
                telefone: '(11) 99999-9999',
                online: false
            };

            const { data: data2, error: error2 } = await supabase
                .from('user_profiles')
                .insert([adminDataSimple])
                .select();

            if (error2) {
                console.error('❌ Erro na segunda tentativa:', error2.message);
                console.log('\n💡 Execute manualmente no Supabase Dashboard:');
                console.log('1. Vá em SQL Editor');
                console.log('2. Execute: DROP TABLE IF EXISTS public.user_profiles CASCADE;');
                console.log('3. Execute o schema.sql completo novamente');
            } else {
                console.log('✅ Usuário admin criado com sucesso!');
                console.log('📋 Credenciais: admin / admin123');
            }
        } else {
            console.log('✅ Usuário admin criado com sucesso!');
            console.log('📋 Credenciais de acesso:');
            console.log('👤 Login: admin');
            console.log('🔑 Senha: admin123');
            console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

fixSchema();
