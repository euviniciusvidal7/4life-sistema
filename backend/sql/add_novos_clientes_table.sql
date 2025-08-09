-- Criar extensão de UUID se necessário
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de novos clientes confirmados por vendedores
CREATE TABLE IF NOT EXISTS public.novos_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  vendedor_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novos_clientes_vendedor ON public.novos_clientes(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_novos_clientes_lead ON public.novos_clientes(lead_id);