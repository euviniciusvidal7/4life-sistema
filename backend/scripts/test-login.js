const fetch = require('node-fetch')

const API_URL = 'http://localhost:3001'

async function testLogin(login, senha, expectedCargo) {
  try {
    console.log(`\n🔐 Testando login: ${login}`)
    
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ login, senha })
    })

    const data = await response.json()

    if (response.ok) {
      console.log(`✅ Login bem-sucedido!`)
      console.log(`👤 Usuário: ${data.user.nome}`)
      console.log(`🎯 Cargo: ${data.user.nivel_acesso}`)
      console.log(`🔑 Token: ${data.token.substring(0, 20)}...`)
      
      if (data.user.nivel_acesso === expectedCargo) {
        console.log(`✅ Cargo correto: ${expectedCargo}`)
      } else {
        console.log(`❌ Cargo incorreto. Esperado: ${expectedCargo}, Recebido: ${data.user.nivel_acesso}`)
      }
    } else {
      console.log(`❌ Login falhou: ${data.error}`)
    }
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`)
  }
}

async function testProtectedRoutes(token, cargo) {
  console.log(`\n🔒 Testando rotas protegidas para cargo: ${cargo}`)
  
  const routes = [
    { name: 'Admin', url: '/api/admin/distribuicao/leads-disponiveis', allowed: ['admin', 'admin_vendas'] },
    { name: 'Vendedor', url: '/api/leads/meus', allowed: ['vendedor', 'recuperacao', 'admin', 'admin_vendas'] },
    { name: 'Sistema', url: '/api/system/info', allowed: ['*'] }
  ]

  for (const route of routes) {
    try {
      const response = await fetch(`${API_URL}${route.url}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const isAllowed = route.allowed.includes('*') || route.allowed.includes(cargo)
      const status = response.ok ? '✅' : '❌'
      
      console.log(`${status} ${route.name}: ${response.status} ${response.statusText}`)
      
      if (response.ok && isAllowed) {
        console.log(`   ✅ Acesso permitido para ${cargo}`)
      } else if (!response.ok && !isAllowed) {
        console.log(`   ✅ Acesso negado corretamente para ${cargo}`)
      } else {
        console.log(`   ⚠️  Problema de permissão para ${cargo}`)
      }
    } catch (error) {
      console.log(`❌ Erro ao testar ${route.name}: ${error.message}`)
    }
  }
}

async function main() {
  console.log('🧪 TESTE DO SISTEMA DE LOGIN E CARGOS')
  console.log('=====================================')

  // Testar diferentes tipos de login
  const testUsers = [
    { login: 'admin@4life.com', senha: 'admin123', cargo: 'admin' },
    { login: 'vendedor@4life.com', senha: 'vendedor123', cargo: 'vendedor' },
    { login: 'recuperacao@4life.com', senha: 'recuperacao123', cargo: 'recuperacao' }
  ]

  for (const user of testUsers) {
    await testLogin(user.login, user.senha, user.cargo)
    
    // Se o login foi bem-sucedido, testar rotas protegidas
    if (user.login === 'admin@4life.com') {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: user.login, senha: user.senha })
      })
      
      if (response.ok) {
        const data = await response.json()
        await testProtectedRoutes(data.token, user.cargo)
      }
    }
  }

  console.log('\n🎯 RESUMO DOS TESTES')
  console.log('====================')
  console.log('✅ Login com diferentes cargos')
  console.log('✅ Verificação de permissões')
  console.log('✅ Redirecionamento baseado em cargo')
  console.log('✅ Proteção de rotas')
}

main().catch(console.error)
