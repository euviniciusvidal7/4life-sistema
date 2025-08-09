-- =====================================================
-- SCHEMA DO BANCO DE DADOS 4LIFE SISTEMA
-- =====================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: user_profiles
-- =====================================================
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

-- =====================================================
-- TABELA: leads
-- =====================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    endereco TEXT,
    contato VARCHAR(50),
    problema_relatado TEXT,
    conversa_ia TEXT,
    pacote_escolhido VARCHAR(100),
    valor_final DECIMAL(10,2),
    rec BOOLEAN DEFAULT false,
    tipo_lead VARCHAR(20) NOT NULL CHECK (tipo_lead IN ('recuperacao', 'venda_concluida', 'novo_lead')),
    status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'distribuido', 'em_andamento', 'finalizado', 'lixeira')),
    vendedor_id UUID REFERENCES public.user_profiles(id),
    data_distribuicao TIMESTAMP WITH TIME ZONE,
    data_finalizacao TIMESTAMP WITH TIME ZONE,
    observacoes TEXT,
    arquivo_original VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: lead_distribuicoes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.lead_distribuicoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    vendedor_id UUID REFERENCES public.user_profiles(id),
    tipo_distribuicao VARCHAR(20) NOT NULL CHECK (tipo_distribuicao IN ('automatica', 'manual')),
    algoritmo_usado VARCHAR(20) CHECK (algoritmo_usado IN ('balanceado', 'round_robin', 'manual')),
    data_distribuicao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: vendedor_stats
-- =====================================================
CREATE TABLE IF NOT EXISTS public.vendedor_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendedor_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    leads_recebidos INTEGER DEFAULT 0,
    leads_finalizados INTEGER DEFAULT 0,
    leads_lixeira INTEGER DEFAULT 0,
    tempo_medio_atendimento INTEGER DEFAULT 0, -- em minutos
    taxa_conversao DECIMAL(5,2) DEFAULT 0.00, -- porcentagem
    valor_total_vendas DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vendedor_id, data)
);

-- =====================================================
-- TRIGGERS PARA updated_at
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para cada tabela
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendedor_stats_updated_at BEFORE UPDATE ON public.vendedor_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para obter vendedores online
CREATE OR REPLACE FUNCTION get_vendedores_online()
RETURNS TABLE (
    id UUID,
    login VARCHAR(50),
    nome_completo VARCHAR(100),
    nivel_acesso VARCHAR(20),
    ultimo_acesso TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.login,
        up.nome_completo,
        up.nivel_acesso,
        up.ultimo_acesso
    FROM public.user_profiles up
    WHERE up.online = true 
    AND up.nivel_acesso IN ('vendedor', 'admin_vendas', 'vendas')
    AND up.ultimo_acesso > NOW() - INTERVAL '30 minutes'
    ORDER BY up.ultimo_acesso DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar estatísticas do vendedor
CREATE OR REPLACE FUNCTION update_vendedor_stats(
    p_vendedor_id UUID,
    p_data DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
DECLARE
    v_leads_recebidos INTEGER;
    v_leads_finalizados INTEGER;
    v_leads_lixeira INTEGER;
    v_valor_total DECIMAL(10,2);
    v_tempo_medio INTEGER;
BEGIN
    -- Contar leads recebidos hoje
    SELECT COUNT(*) INTO v_leads_recebidos
    FROM public.leads l
    JOIN public.lead_distribuicoes ld ON l.id = ld.lead_id
    WHERE ld.vendedor_id = p_vendedor_id
    AND DATE(ld.data_distribuicao) = p_data;

    -- Contar leads finalizados hoje
    SELECT COUNT(*) INTO v_leads_finalizados
    FROM public.leads l
    WHERE l.vendedor_id = p_vendedor_id
    AND l.status = 'finalizado'
    AND DATE(l.data_finalizacao) = p_data;

    -- Contar leads na lixeira hoje
    SELECT COUNT(*) INTO v_leads_lixeira
    FROM public.leads l
    WHERE l.vendedor_id = p_vendedor_id
    AND l.status = 'lixeira'
    AND DATE(l.updated_at) = p_data;

    -- Calcular valor total de vendas
    SELECT COALESCE(SUM(l.valor_final), 0) INTO v_valor_total
    FROM public.leads l
    WHERE l.vendedor_id = p_vendedor_id
    AND l.status = 'finalizado'
    AND DATE(l.data_finalizacao) = p_data;

    -- Calcular tempo médio de atendimento (em minutos)
    SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (l.data_finalizacao - l.data_distribuicao))/60), 0)::INTEGER INTO v_tempo_medio
    FROM public.leads l
    WHERE l.vendedor_id = p_vendedor_id
    AND l.status = 'finalizado'
    AND l.data_finalizacao IS NOT NULL
    AND l.data_distribuicao IS NOT NULL
    AND DATE(l.data_finalizacao) = p_data;

    -- Inserir ou atualizar estatísticas
    INSERT INTO public.vendedor_stats (
        vendedor_id, 
        data, 
        leads_recebidos, 
        leads_finalizados, 
        leads_lixeira, 
        valor_total_vendas, 
        tempo_medio_atendimento,
        taxa_conversao
    ) VALUES (
        p_vendedor_id,
        p_data,
        v_leads_recebidos,
        v_leads_finalizados,
        v_leads_lixeira,
        v_valor_total,
        v_tempo_medio,
        CASE 
            WHEN v_leads_recebidos > 0 THEN 
                (v_leads_finalizados::DECIMAL / v_leads_recebidos::DECIMAL) * 100
            ELSE 0
        END
    )
    ON CONFLICT (vendedor_id, data) DO UPDATE SET
        leads_recebidos = EXCLUDED.leads_recebidos,
        leads_finalizados = EXCLUDED.leads_finalizados,
        leads_lixeira = EXCLUDED.leads_lixeira,
        valor_total_vendas = EXCLUDED.valor_total_vendas,
        tempo_medio_atendimento = EXCLUDED.tempo_medio_atendimento,
        taxa_conversao = EXCLUDED.taxa_conversao,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_distribuicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendedor_stats ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS PARA user_profiles
-- =====================================================

-- Admins podem ver todos os usuários
CREATE POLICY "Admins can view all users" ON public.user_profiles
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR
        auth.jwt() ->> 'role' = 'admin_vendas'
    );

-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (
        auth.uid()::text = user_id::text
    );

-- Admins podem inserir/atualizar usuários
CREATE POLICY "Admins can manage users" ON public.user_profiles
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- =====================================================
-- POLÍTICAS RLS PARA leads
-- =====================================================

-- Admins podem ver todos os leads
CREATE POLICY "Admins can view all leads" ON public.leads
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR
        auth.jwt() ->> 'role' = 'admin_vendas'
    );

-- Vendedores podem ver apenas seus leads
CREATE POLICY "Vendors can view own leads" ON public.leads
    FOR SELECT USING (
        vendedor_id::text = auth.uid()::text OR
        status = 'disponivel'
    );

-- Admins podem inserir/atualizar leads
CREATE POLICY "Admins can manage leads" ON public.leads
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR
        auth.jwt() ->> 'role' = 'admin_vendas'
    );

-- Vendedores podem atualizar apenas seus leads
CREATE POLICY "Vendors can update own leads" ON public.leads
    FOR UPDATE USING (
        vendedor_id::text = auth.uid()::text
    );

-- =====================================================
-- POLÍTICAS RLS PARA lead_distribuicoes
-- =====================================================

-- Admins podem ver todas as distribuições
CREATE POLICY "Admins can view all distributions" ON public.lead_distribuicoes
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR
        auth.jwt() ->> 'role' = 'admin_vendas'
    );

-- Vendedores podem ver apenas suas distribuições
CREATE POLICY "Vendors can view own distributions" ON public.lead_distribuicoes
    FOR SELECT USING (
        vendedor_id::text = auth.uid()::text
    );

-- Admins podem gerenciar distribuições
CREATE POLICY "Admins can manage distributions" ON public.lead_distribuicoes
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR
        auth.jwt() ->> 'role' = 'admin_vendas'
    );

-- =====================================================
-- POLÍTICAS RLS PARA vendedor_stats
-- =====================================================

-- Admins podem ver todas as estatísticas
CREATE POLICY "Admins can view all stats" ON public.vendedor_stats
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR
        auth.jwt() ->> 'role' = 'admin_vendas'
    );

-- Vendedores podem ver apenas suas estatísticas
CREATE POLICY "Vendors can view own stats" ON public.vendedor_stats
    FOR SELECT USING (
        vendedor_id::text = auth.uid()::text
    );

-- Admins podem gerenciar estatísticas
CREATE POLICY "Admins can manage stats" ON public.vendedor_stats
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR
        auth.jwt() ->> 'role' = 'admin_vendas'
    );

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para leads
CREATE INDEX IF NOT EXISTS idx_leads_vendedor_id ON public.leads(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_tipo_lead ON public.leads(tipo_lead);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_rec ON public.leads(rec);

-- Índices para lead_distribuicoes
CREATE INDEX IF NOT EXISTS idx_lead_distribuicoes_lead_id ON public.lead_distribuicoes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_distribuicoes_vendedor_id ON public.lead_distribuicoes(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_lead_distribuicoes_data ON public.lead_distribuicoes(data_distribuicao);

-- Índices para user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_nivel_acesso ON public.user_profiles(nivel_acesso);
CREATE INDEX IF NOT EXISTS idx_user_profiles_online ON public.user_profiles(online);
CREATE INDEX IF NOT EXISTS idx_user_profiles_ultimo_acesso ON public.user_profiles(ultimo_acesso);

-- Índices para vendedor_stats
CREATE INDEX IF NOT EXISTS idx_vendedor_stats_vendedor_id ON public.vendedor_stats(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_vendedor_stats_data ON public.vendedor_stats(data);

-- =====================================================
-- COMENTÁRIOS NAS TABELAS
-- =====================================================

COMMENT ON TABLE public.user_profiles IS 'Perfis dos usuários do sistema 4Life';
COMMENT ON TABLE public.leads IS 'Leads capturados pelo sistema';
COMMENT ON TABLE public.lead_distribuicoes IS 'Histórico de distribuição de leads';
COMMENT ON TABLE public.vendedor_stats IS 'Estatísticas diárias dos vendedores';

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================
