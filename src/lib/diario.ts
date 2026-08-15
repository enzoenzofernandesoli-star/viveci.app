import { useEffect, useState } from 'react'
import { supabase } from './supabase.ts'
import type { Refeicao } from './refeicoes.ts'

export type OrigemItem = 'alimento' | 'rapida'

export type ItemDiario = {
  id: string
  data: string // AAAA-MM-DD
  refeicao: Refeicao
  origem: OrigemItem
  nome: string
  alimento_id: number | null
  quantidade: number | null // gramas; null na entrada rápida
  kcal: number
  prot_g: number
  carb_g: number
  gord_g: number
}

// ─────────────────────────────────────────────────────────────
// PONTO DE TROCA PARA O SUPABASE — tabela `diario_alimentar`
// ─────────────────────────────────────────────────────────────

export async function adicionarItem(userId: string, item: Omit<ItemDiario, 'id'>): Promise<string> {
  const { data, error } = await supabase
    .from('diario_alimentar')
    .insert({
      user_id: userId,
      data: item.data,
      refeicao: item.refeicao,
      origem: item.origem,
      nome_livre: item.nome,
      alimento_id: item.alimento_id,
      quantidade: item.quantidade,
      kcal: item.kcal,
      prot_g: item.prot_g,
      carb_g: item.carb_g,
      gord_g: item.gord_g,
    })
    .select()
    .single()
  if (error) throw error
  return data.id
}

export async function removerItem(id: string) {
  const { error } = await supabase.from('diario_alimentar').delete().eq('id', id)
  if (error) throw error
}

export async function copiarDia(userId: string, de: string, para: string) {
  const { data: origem, error: erroOrigem } = await supabase
    .from('diario_alimentar')
    .select('*')
    .eq('user_id', userId)
    .eq('data', de)
  if (erroOrigem) throw erroOrigem
  if (!origem || origem.length === 0) return

  const { error: erroInsert } = await supabase.from('diario_alimentar').insert(
    origem.map((item) => ({
      user_id: userId,
      data: para,
      refeicao: item.refeicao,
      origem: item.origem,
      nome_livre: item.nome_livre,
      alimento_id: item.alimento_id,
      quantidade: item.quantidade,
      kcal: item.kcal,
      prot_g: item.prot_g,
      carb_g: item.carb_g,
      gord_g: item.gord_g,
    })),
  )
  if (erroInsert) throw erroInsert
}

function linhaParaItem(linha: {
  id: string
  data: string
  refeicao: string
  origem: string
  nome_livre: string
  alimento_id: number | null
  quantidade: number | null
  kcal: number
  prot_g: number
  carb_g: number
  gord_g: number
}): ItemDiario {
  return {
    id: linha.id,
    data: linha.data,
    refeicao: linha.refeicao as Refeicao,
    origem: linha.origem as OrigemItem,
    nome: linha.nome_livre,
    alimento_id: linha.alimento_id,
    quantidade: linha.quantidade,
    kcal: linha.kcal,
    prot_g: linha.prot_g,
    carb_g: linha.carb_g,
    gord_g: linha.gord_g,
  }
}

/** Itens de um dia. */
export function useDia(userId: string | undefined, data: string) {
  const [itens, setItens] = useState<ItemDiario[]>([])
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
      .from('diario_alimentar')
      .select('*')
      .eq('user_id', userId)
      .eq('data', data)
      .then(({ data: linhas, error }) => {
        if (cancelado) return
        if (error) setErro(error.message)
        else setItens((linhas ?? []).map(linhaParaItem))
        setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [userId, data, versao])

  return { itens, carregando, erro, recarregar: () => setVersao((v) => v + 1) }
}

/** Datas que já têm algum registro — usado pelo ponto no seletor de dia. */
export function useDiasComRegistro(userId: string | undefined) {
  const [datas, setDatas] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!userId) return
    let cancelado = false
    supabase
      .from('diario_alimentar')
      .select('data')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (cancelado || !data) return
        setDatas(new Set(data.map((d) => d.data)))
      })
    return () => {
      cancelado = true
    }
  }, [userId])

  return datas
}

export function somar(lista: ItemDiario[]) {
  return lista.reduce(
    (t, i) => ({
      kcal: t.kcal + i.kcal,
      prot_g: t.prot_g + i.prot_g,
      carb_g: t.carb_g + i.carb_g,
      gord_g: t.gord_g + i.gord_g,
    }),
    { kcal: 0, prot_g: 0, carb_g: 0, gord_g: 0 },
  )
}
