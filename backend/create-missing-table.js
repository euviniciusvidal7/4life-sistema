require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function createMissingTable() {
    console.log('🔧 Criando tabela user_profiles que está faltando...');
    
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // SQL para criar apenas a tabela user_profiles
        const createUserProfilesSQL = `
        -- Habilitar extensão UUID (se não existir)
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        -- Criar tabela user_profiles
        CREATE TABLE IF NOT EXISTS public.user_profiles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            login VARCHAR(50) UNIQUE NOT NULL,
            senha VARCHAR(255) NOT NULL,
            nivel_acesso VARCHAR(20) NOT NULL CHECK (nivel_acesso IN ('admin', 'vendedor', 'admin_vendas', 'recuperacao', 'ltv', 'logistica', 'vendas')),
            nome_completo VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE,
            telefone VARCHAR(20),
            online BOOLEAN DEFAULT false,
            ultimo_acesso TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Criar trigger para updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        CREATE TRIGGER update_user_profiles_updated_at 
        BEFORE UPDATE ON public.user_profiles 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        -- Habilitar RLS
        ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

        -- Criar políticas RLS básicas
        CREATE POLICY "Admins can view all users" ON public.user_profiles
            FOR SELECT USING (
                auth.jwt() ->> 'role' = 'admin' OR
                auth.jwt() ->> 'role' = 'admin_vendas'
            );

        CREATE POLICY "Users can view own profile" ON public.user_profiles
            FOR SELECT USING (
                auth.uid()::text = user_id::text
            );

        CREATE POLICY "Admins can manage users" ON public.user_profiles
            FOR ALL USING (
                auth.jwt() ->> 'role' = 'admin'
            );

        -- Criar índices
        CREATE INDEX IF NOT EXISTS idx_user_profiles_nivel_acesso ON public.user_profiles(nivel_acesso);
        CREATE INDEX IF NOT EXISTS idx_user_profiles_online ON public.user_profiles(online);
        CREATE INDEX IF NOT EXISTS idx_user_profiles_ultimo_acesso ON public.user_profiles(ultimo_acesso);

        -- Adicionar comentário
        COMMENT ON TABLE public.user_profiles IS 'Perfis dos usuários do sistema 4Life';
        `;

        console.log('📄 SQL preparado para criar user_profiles');
        console.log('💡 Execute este SQL no Supabase Dashboard:');
        console.log('\n' + '='.repeat(50));
        console.log(createUserProfilesSQL);
        console.log('='.repeat(50));

        console.log('\n📋 Instruções:');
        console.log('1. Vá para o Supabase Dashboard');
        console.log('2. Clique em "SQL Editor"');
        console.log('3. Clique em "New Query"');
        console.log('4. Cole o SQL acima');
        console.log('5. Clique em "Run"');
        console.log('6. Depois execute: node test-user-profiles.js');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

createMissingTable();
