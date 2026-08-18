import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
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
    <div className="min-h-dvh px-6 py-8 sm:px-10 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-16">
      <section className="flex min-h-52 flex-col justify-between border-b border-line/70 pb-10 lg:min-h-0 lg:border-b-0 lg:border-r lg:py-8 lg:pr-16">
        <Logo className="text-xl" />
        <div className="mt-16 max-w-xl lg:mt-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Vim. Vi. Venci.</p>
          <h1 className="mt-4 text-[40px] font-bold leading-[0.98] tracking-[-0.045em] text-ink sm:text-5xl lg:text-6xl">
            Treine. Evolua.
            <br />
            Conquiste.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-ink-2">
            Seu treino, sua alimentação e sua evolução reunidos em um só lugar.
          </p>
        </div>
      </section>

      <main className="flex items-center py-10 lg:py-8">
        <div className="w-full max-w-md lg:mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-2">
            {modo === 'entrar' ? 'Acesso' : 'Novo perfil'}
          </p>
          <h2 className="mt-2 text-[28px] font-bold tracking-[-0.035em] text-ink">
            {modo === 'entrar' ? 'Entre na sua conta.' : 'Crie sua conta.'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-2">
            {modo === 'entrar' ? 'Continue de onde parou.' : 'Comece sua evolução no VIVECI.'}
          </p>

          {cadastroFeito ? (
            <div className="mt-8 border-y border-line py-6">
              <p className="text-sm font-semibold text-ink">Conta criada.</p>
              <p className="mt-2 text-sm leading-6 text-ink-2">Confira seu email para confirmar o cadastro antes de entrar.</p>
              <button type="button" onClick={() => { setCadastroFeito(false); setModo('entrar') }} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand">
                Voltar para entrar
              </button>
            </div>
          ) : (
            <form onSubmit={enviar} className="mt-8 space-y-5">
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
                    className="h-12 w-full rounded-xl border border-line bg-card px-4 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
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
                  className="h-12 w-full rounded-xl border border-line bg-card px-4 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
                  placeholder="voce@email.com"
                />
                {modo === 'entrar' && <Link to="/recuperar-senha" className="mt-2 inline-flex min-h-11 items-center text-xs font-semibold text-ink-2 hover:text-brand">Esqueci minha senha</Link>}
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
                  className="h-12 w-full rounded-xl border border-line bg-card px-4 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
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
          {!cadastroFeito && (
            <p className="mt-6 text-center text-sm text-ink-2">
              {modo === 'entrar' ? 'Ainda não tem uma conta?' : 'Já tem uma conta?'}{' '}
              <button type="button" onClick={() => setModo(modo === 'entrar' ? 'cadastrar' : 'entrar')} className="inline-flex min-h-11 items-center font-semibold text-brand">
                {modo === 'entrar' ? 'Criar conta' : 'Entrar'}
              </button>
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
