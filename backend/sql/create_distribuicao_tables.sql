-- Criar tabela para configurações de distribuição
CREATE TABLE IF NOT EXISTS distribuicao_config (
  id SERIAL PRIMARY KEY,
  vendedor_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  vendedor_nome VARCHAR(255) NOT NULL,
  porcentagem INTEGER NOT NULL CHECK (porcentagem >= 0 AND porcentagem <= 100),
  tipo_leads VARCHAR(20) NOT NULL CHECK (tipo_leads IN ('recuperacao', 'venda', 'ambos')),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_distribuicao_config_vendedor_id ON distribuicao_config(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_distribuicao_config_porcentagem ON distribuicao_config(porcentagem);

-- Criar tabela para configurações do sistema
CREATE TABLE IF NOT EXISTS sistema_config (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT,
  descricao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração inicial da distribuição automática
INSERT INTO sistema_config (chave, valor, descricao) 
VALUES ('distribuicao_automatica', 'false', 'Status da distribuição automática de leads')
ON CONFLICT (chave) DO NOTHING;

-- Criar tabela para leads se não existir
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255),
  contato VARCHAR(255),
  problema_relatado TEXT,
  rec BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'disponivel',
  vendedor_id UUID REFERENCES user_profiles(id),
  arquivo_origem VARCHAR(255),
  dados_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para a tabela leads
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_rec ON leads(rec);
CREATE INDEX IF NOT EXISTS idx_leads_vendedor_id ON leads(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at); 