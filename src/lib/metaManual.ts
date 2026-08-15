import { useEffect, useState } from 'react'
import { supabase } from './supabase.ts'
import { calcularMetas, aplicarMetaManual, type Metas } from './metas.ts'
import type { Perfil } from './perfil.ts'

// ─────────────────────────────────────────────────────────────
// PONTO DE TROCA PARA O SUPABASE — tabela `metas_nutricionais`
// Sem registro ativo, a meta é a calculada automaticamente a partir do
// perfil. Quando o usuário edita, grava uma nova linha ativa e desativa
// a anterior — mantém histórico.
// ─────────────────────────────────────────────────────────────

/** Meta nutricional em vigor: manual se existir, senão a calculada do perfil. */
export function useMetaAtiva(userId: string | undefined, perfil: Perfil | null) {
  const [metaManual, setMetaManual] = useState<Metas | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    if (!userId) {
      setCarregando(false)
      return
    }
    let cancelado = false
    setCarregando(true)
    setErro(null)
    supabase
      .from('metas_nutricionais')
      .select('*')
      .eq('user_id', userId)
      .eq('ativa', true)
      .order('calculada_em', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) {
          setErro(error.message)
        } else if (data) {
          setMetaManual({
            tmb: data.tmb,
            get: data.get,
            fator_atividade: 0,
            meta_kcal: data.meta_kcal,
            meta_prot_g: data.meta_prot_g,
            meta_carb_g: data.meta_carb_g,
            meta_gord_g: data.meta_gord_g,
            meta_limitada: false,
            low_carb: false,
          })
        } else {
          setMetaManual(null)
        }
        setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [userId, versao])

  const metas = metaManual ?? (perfil ? calcularMetas(perfil) : null)

  return { metas, ehManual: metaManual !== null, carregando, erro, recarregar: () => setVersao((v) => v + 1) }
}

export async function definirMetaManual(userId: string, base: Metas, novoKcal: number, peso_kg: number) {
  const nova = aplicarMetaManual(base, novoKcal, peso_kg)

  const { error: erroDesativa } = await supabase
    .from('metas_nutricionais')
    .update({ ativa: false })
    .eq('user_id', userId)
    .eq('ativa', true)
  if (erroDesativa) throw erroDesativa

  const { error: erroInsere } = await supabase.from('metas_nutricionais').insert({
    user_id: userId,
    tmb: nova.tmb,
    get: nova.get,
    meta_kcal: nova.meta_kcal,
    meta_prot_g: nova.meta_prot_g,
    meta_carb_g: nova.meta_carb_g,
    meta_gord_g: nova.meta_gord_g,
    ativa: true,
  })
  if (erroInsere) throw erroInsere
}
