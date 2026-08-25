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
      emailRedirectTo: window.location.origin,
    },
  })
  if (error) throw error
}

export async function sair() {
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
