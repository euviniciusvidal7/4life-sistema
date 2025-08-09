#!/usr/bin/env node
/* eslint-disable no-console */
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env')
  process.exit(1)
}

const args = require('minimist')(process.argv.slice(2))
const login = args.login || args.l || 'admin@4life.com'
const senha = args.senha || args.p || 'admin123'
const nome = args.nome || args.n || 'Administrador'
const email = args.email || login
const nivel = args.nivel || 'admin'

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

  // já existe?
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('id, login')
    .or(`login.eq.${login},email.eq.${email}`)
    .maybeSingle()

  if (existing) {
    console.log('Usuário já existe:', existing.login)
    process.exit(0)
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .insert([
      {
        login,
        senha, // em produção, usar hash
        nome,
        email,
        nivel_acesso: nivel,
        status_online: false,
        ultimo_acesso: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar admin:', error)
    process.exit(1)
  }

  console.log('Admin criado com sucesso:', data.login)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


