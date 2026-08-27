import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Logo } from '../components/Logo'
import { entrar, cadastrar, useSessao } from '../lib/auth'
import homeHero from '../assets/viveci/home-hero.webp'
import { mensagemErro } from '../lib/mensagemErro'

type Modo = 'entrar' | 'cadastrar'

export default function Login() {
  const navigate = useNavigate()
  const [parametros, setParametros] = useSearchParams()
  const { sessao, carregando: carregandoSessao } = useSessao()
  const [modo, setModo] = useState<Modo>('entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [cadastroFeito, setCadastroFeito] = useState(false)
  const [emailConfirmado, setEmailConfirmado] = useState(false)

  useEffect(() => {
    setErro(null)
  }, [modo])

  useEffect(() => {
    if (carregandoSessao || !sessao?.user.email_confirmed_at || parametros.get('email-confirmado') !== '1') return
    setEmailConfirmado(true)
    setParametros({}, { replace: true })
  }, [carregandoSessao, parametros, sessao, setParametros])

  if (!carregandoSessao && sessao && !emailConfirmado && parametros.get('email-confirmado') !== '1') return <Navigate to="/" replace />

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
      setErro(mensagemErro(err, 'Não foi possível continuar. Tente novamente.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-dvh px-6 py-8 sm:px-10 lg:grid lg:grid-cols-2 lg:gap-0 lg:p-0">
      <section className="relative hidden min-h-dvh overflow-hidden border-r border-line/60 lg:block">
        <img src={homeHero} alt="" decoding="async" className="absolute inset-0 h-full w-full object-cover object-[38%_center]" />
        <div className="absolute inset-0 bg-black/15" />
        <Logo className="absolute left-10 top-9 text-xl" />
        <p className="absolute bottom-10 left-10 text-[10px] font-semibold uppercase tracking-[0.18em] text-silver">Treine · Evolua · Conquiste</p>
      </section>

      <main className="flex items-center lg:px-14 lg:py-10">
        <div className="w-full max-w-md lg:mx-auto">
          <Logo className="mb-16 text-xl lg:hidden" />
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-2">
            {modo === 'entrar' ? 'Acesso' : 'Novo perfil'}
          </p>
          <h2 className="mt-2 text-[28px] font-bold tracking-[-0.035em] text-ink">
            {modo === 'entrar' ? 'Entre na sua conta.' : 'Crie sua conta.'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-2">
            {modo === 'entrar' ? 'Continue de onde parou.' : 'Comece sua evolução no VIVECI.'}
          </p>

          {emailConfirmado ? (
            <div className="mt-8 border-y border-line py-8 text-center" role="status">
              <CheckCircle2 aria-hidden="true" className="mx-auto size-12 text-brand" strokeWidth={1.75} />
              <p className="mt-5 text-xl font-semibold text-ink">E-mail confirmado.</p>
              <p className="mt-2 text-sm leading-6 text-ink-2">Sua conta está pronta. Agora você já pode continuar no VIVECI.</p>
              <button type="button" onClick={() => navigate('/', { replace: true })} className="mt-6 h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover">
                Continuar
              </button>
            </div>
          ) : cadastroFeito ? (
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
