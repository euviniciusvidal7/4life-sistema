"use client"

import { useState } from 'react'
import { Toaster, toast } from 'react-hot-toast'

export default function LoginPage() {
  const [login, setLogin] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      console.log('Tentando conectar com:', apiUrl)
      
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login, senha })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        toast.error(errorData.error || `Erro ${response.status}: ${response.statusText}`)
        return
      }

      const data = await response.json()

      // Salvar token e dados do usuário
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('cargo', data.user.nivel_acesso)

      toast.success("Login realizado com sucesso!")
      
      // Redirecionar conforme o nível de acesso
      const nivel = String(data.user.nivel_acesso || '').toLowerCase()
      const isVendedor = ['vendedor','recuperacao','vendas'].includes(nivel)
      const isAdmin = ['admin','admin_vendas'].includes(nivel)
      const target = isVendedor ? '/vendedor' : (isAdmin ? '/admin/overview' : '/dashboard')

      setTimeout(() => {
        window.location.href = target
      }, 800)
      
    } catch (err) {
      console.error('Erro de conexão:', err)
      toast.error("Erro de conexão com o servidor. Verifique se o backend está rodando.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-gray-950">
      <Toaster position="top-right" />
      {/* Lado esquerdo: cena com logo e pílulas */}
      <div className="relative hidden lg:block overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 to-white dark:from-gray-900 dark:to-gray-950" />
        {/* Pílulas animadas */}
        <div className="absolute inset-0 opacity-70">
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-emerald-500/15 border border-emerald-400/20"
              style={{
                width: `${80 + (i % 5) * 12}px`,
                height: `${24 + (i % 3) * 6}px`,
                left: `${(i * 11) % 95}%`,
                top: `${(i * 37) % 95}%`,
                transform: `rotate(${(i * 23) % 180}deg)`,
                animation: `float ${12 + (i % 6)}s linear ${i * 0.6}s infinite alternate`,
              }}
            />
          ))}
        </div>
        {/* Logo verde ao centro */}
        <div className="relative z-10 h-full w-full flex items-center justify-center p-10">
          <img src="/logo-light.png" alt="4Life" className="w-64 h-auto shadow-xl rounded-lg" />
        </div>
      </div>

      {/* Lado direito: formulário de login */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 shadow-xl rounded-xl p-8 border border-gray-200 dark:border-gray-800">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Acesso ao Sistema</h1>
            <p className="text-gray-600 dark:text-gray-400">Entre com suas credenciais</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Login</label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Digite seu login"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Digite sua senha"
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Entrando...
                </div>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">4Life • Todos os direitos reservados</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0) rotate(var(--r, 0deg)); }
          100% { transform: translateY(-20px) rotate(calc(var(--r, 0deg) + 8deg)); }
        }
      `}</style>
    </div>
  )
}
