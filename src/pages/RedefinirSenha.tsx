import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { redefinirSenha } from '../lib/auth'

export default function RedefinirSenha() {
  const navigate = useNavigate(); const [senha, setSenha] = useState(''); const [erro, setErro] = useState<string | null>(null); const [enviando, setEnviando] = useState(false)
  async function enviar(e: FormEvent) { e.preventDefault(); setEnviando(true); setErro(null); try { await redefinirSenha(senha); navigate('/', { replace: true }) } catch { setErro('O link pode ter expirado. Solicite uma nova recuperação.') } finally { setEnviando(false) } }
  return <main className="mx-auto min-h-dvh max-w-md px-6 py-10"><Logo className="text-lg" /><p className="mt-16 text-xs font-semibold uppercase tracking-[0.1em] text-brand">Segurança</p><h1 className="mt-3 text-[28px] font-bold tracking-[-0.04em]">Crie uma nova senha</h1><form onSubmit={enviar} className="mt-8 space-y-5"><label className="block text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Nova senha<input type="password" required minLength={8} value={senha} onChange={(e) => setSenha(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-line bg-card px-4 text-sm text-ink focus:border-brand focus:outline-none" /></label>{erro && <p className="text-sm text-down">{erro}</p>}<button disabled={enviando} className="h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white disabled:opacity-50">{enviando ? 'Salvando...' : 'Salvar nova senha'}</button></form></main>
}
