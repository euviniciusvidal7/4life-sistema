require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
    console.log('👤 Criando usuário admin inicial...');
    
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Dados do admin
        const adminData = {
            login: 'admin',
            senha: await bcrypt.hash('admin123', 10), // Senha temporária
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

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

createAdminUser();
