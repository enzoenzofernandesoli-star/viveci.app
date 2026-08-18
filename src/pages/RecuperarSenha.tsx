import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { solicitarRecuperacaoSenha } from '../lib/auth'

export default function RecuperarSenha() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  async function enviar(e: FormEvent) {
    e.preventDefault(); setEnviando(true); setMensagem(null)
    try { await solicitarRecuperacaoSenha(email); setMensagem('Se existir uma conta com este email, o link de recuperação será enviado.') }
    catch { setMensagem('Não foi possível solicitar a recuperação agora.') }
    finally { setEnviando(false) }
  }

  return <main className="mx-auto min-h-dvh max-w-md px-6 py-10"><Logo className="text-lg" /><p className="mt-16 text-xs font-semibold uppercase tracking-[0.1em] text-brand">Acesso</p><h1 className="mt-3 text-[28px] font-bold tracking-[-0.04em]">Recuperar senha</h1><p className="mt-2 text-sm text-ink-2">Enviaremos um link seguro para o seu email.</p><form onSubmit={enviar} className="mt-8 space-y-5"><label className="block text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-line bg-card px-4 text-sm text-ink focus:border-brand focus:outline-none" /></label><button disabled={enviando} className="h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white disabled:opacity-50">{enviando ? 'Enviando...' : 'Enviar link'}</button></form>{mensagem && <p className="mt-5 text-sm text-ink-2" role="status">{mensagem}</p>}<Link to="/login" className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-brand">Voltar para entrar</Link></main>
}
