import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { entrar, cadastrar, useSessao } from '../lib/auth'

type Modo = 'entrar' | 'cadastrar'

export default function Login() {
  const { sessao, carregando: carregandoSessao } = useSessao()
  const [modo, setModo] = useState<Modo>('entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [cadastroFeito, setCadastroFeito] = useState(false)

  useEffect(() => {
    setErro(null)
  }, [modo])

  if (!carregandoSessao && sessao) return <Navigate to="/" replace />

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      if (modo === 'entrar') {
        await entrar(email, senha)
      } else {
        await cadastrar(email, senha, nome)
        setCadastroFeito(true)
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Algo deu errado. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo className="text-2xl" />
        </div>

        <div className="rounded-2xl border border-line bg-card p-6">
          <div className="mb-6 flex gap-2">
            <button
              type="button"
              onClick={() => setModo('entrar')}
              className={`h-11 flex-1 rounded-xl text-sm font-semibold transition-colors ${
                modo === 'entrar' ? 'bg-brand/15 text-brand' : 'border border-line text-ink-2'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setModo('cadastrar')}
              className={`h-11 flex-1 rounded-xl text-sm font-semibold transition-colors ${
                modo === 'cadastrar' ? 'bg-brand/15 text-brand' : 'border border-line text-ink-2'
              }`}
            >
              Criar conta
            </button>
          </div>

          {cadastroFeito ? (
            <p className="text-center text-sm text-ink-2">
              Conta criada. Confira seu email para confirmar o cadastro antes de entrar.
            </p>
          ) : (
            <form onSubmit={enviar} className="space-y-4">
              {modo === 'cadastrar' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">
                    Nome
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="h-11 w-full rounded-xl border border-line bg-card-hover px-3 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
                    placeholder="Seu nome"
                  />
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-xl border border-line bg-card-hover px-3 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
                  placeholder="voce@email.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="h-11 w-full rounded-xl border border-line bg-card-hover px-3 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              {erro && <p className="text-sm text-down">{erro}</p>}

              <button
                type="submit"
                disabled={enviando}
                className="h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
              >
                {enviando ? 'Enviando...' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
