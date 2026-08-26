import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { redefinirSenha } from '../lib/auth'
import { TAMANHO_MINIMO_SENHA, validarNovaSenha } from '../lib/senha'

export default function RedefinirSenha() {
  const navigate = useNavigate()
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const erroValidacao = validarNovaSenha(senha, confirmacao)
    if (erroValidacao) return setErro(erroValidacao)
    setEnviando(true)
    setErro(null)
    try {
      await redefinirSenha(senha)
      navigate('/', { replace: true })
    } catch {
      setErro('O link pode ter expirado. Solicite uma nova recuperação.')
    } finally {
      setEnviando(false)
    }
  }

  return <main className="mx-auto min-h-dvh max-w-md px-6 py-10"><Logo className="text-lg" /><p className="mt-16 text-xs font-semibold uppercase tracking-[0.1em] text-brand">Segurança</p><h1 className="mt-3 text-[28px] font-bold tracking-[-0.04em]">Crie uma nova senha</h1><form onSubmit={enviar} className="mt-8 space-y-5"><label className="block text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Nova senha<input type="password" required minLength={TAMANHO_MINIMO_SENHA} autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-line bg-card px-4 text-sm text-ink focus:border-brand focus:outline-none" /></label><label className="block text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Confirmar nova senha<input type="password" required minLength={TAMANHO_MINIMO_SENHA} autoComplete="new-password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-line bg-card px-4 text-sm text-ink focus:border-brand focus:outline-none" /></label>{erro && <p className="text-sm text-down" role="alert">{erro}</p>}<button disabled={enviando} className="h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white disabled:opacity-50">{enviando ? 'Salvando...' : 'Salvar nova senha'}</button></form></main>
}
