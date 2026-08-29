import { useSyncExternalStore } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

type EstadoAuth = { sessao: Session | null; carregando: boolean }

let estado: EstadoAuth = { sessao: null, carregando: true }
const ouvintes = new Set<() => void>()

function definirEstado(novo: EstadoAuth) {
  estado = novo
  ouvintes.forEach((f) => f())
}

supabase.auth.getSession().then(({ data }) => {
  definirEstado({ sessao: data.session, carregando: false })
})

supabase.auth.onAuthStateChange((_evento, sessao) => {
  definirEstado({ sessao, carregando: false })
})

function inscrever(f: () => void) {
  ouvintes.add(f)
  return () => ouvintes.delete(f)
}

export function useSessao(): EstadoAuth {
  return useSyncExternalStore(inscrever, () => estado, () => estado)
}

export async function obterSessaoValida() {
  let { data, error } = await supabase.auth.getSession()
  if (error) throw new Error('Não foi possível validar sua sessão.')
  const pertoDeExpirar = !data.session?.expires_at || data.session.expires_at * 1000 < Date.now() + 60_000
  if (!data.session || pertoDeExpirar) {
    const renovada = await supabase.auth.refreshSession()
    if (renovada.error || !renovada.data.session) throw new Error('Sua sessão expirou. Saia e entre novamente.')
    data = renovada.data
  }
  const sessao = data.session
  if (!sessao) throw new Error('Sua sessão expirou. Saia e entre novamente.')
  const usuario = await supabase.auth.getUser(sessao.access_token)
  if (usuario.error || !usuario.data.user || usuario.data.user.id !== sessao.user.id) throw new Error('Sua sessão expirou. Saia e entre novamente.')
  return sessao
}

export async function entrar(email: string, senha: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
  if (error) throw error
}

export async function cadastrar(email: string, senha: string, nome: string) {
  const { error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome },
      emailRedirectTo: `${window.location.origin}/login?email-confirmado=1`,
    },
  })
  if (error) throw error
}

export async function sair() {
  await supabase.rpc('desativar_meus_push_tokens')
  await supabase.auth.signOut()
}

export async function solicitarRecuperacaoSenha(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/redefinir-senha` })
  if (error) throw error
}

export async function redefinirSenha(senha: string) {
  const { error } = await supabase.auth.updateUser({ password: senha })
  if (error) throw error
}

export async function alterarSenhaComSenhaAtual(email: string, senhaAtual: string, novaSenha: string) {
  const { error: erroAutenticacao } = await supabase.auth.signInWithPassword({
    email,
    password: senhaAtual,
  })
  if (erroAutenticacao) throw erroAutenticacao

  const { error } = await supabase.auth.updateUser({ password: novaSenha })
  if (error) throw error
}

export async function alterarEmailComSenhaAtual(emailAtual: string, senhaAtual: string, novoEmail: string) {
  const { error: erroAutenticacao } = await supabase.auth.signInWithPassword({
    email: emailAtual,
    password: senhaAtual,
  })
  if (erroAutenticacao) throw erroAutenticacao

  const { error } = await supabase.auth.updateUser({ email: novoEmail })
  if (error) throw error
}
