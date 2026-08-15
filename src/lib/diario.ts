import { useCallback, useSyncExternalStore } from 'react'
import type { Refeicao } from './refeicoes'

export type ItemDiario = {
  id: string
  data: string // AAAA-MM-DD
  refeicao: Refeicao
  nome: string
  quantidade: number | null // gramas; null em entrada rápida
  kcal: number
  prot_g: number
  carb_g: number
  gord_g: number
}

// ─────────────────────────────────────────────────────────────
// PONTO DE TROCA PARA O SUPABASE
// Hoje o diário vive na memória, com cópia no navegador para não
// sumir ao recarregar. Quando o backend entrar, só as quatro
// funções abaixo mudam — nenhum componente precisa ser tocado.
// ─────────────────────────────────────────────────────────────

const CHAVE = 'viveci:diario'
let itens: ItemDiario[] = carregar()
const ouvintes = new Set<() => void>()

function carregar(): ItemDiario[] {
  try {
    const cru = localStorage.getItem(CHAVE)
    return cru ? (JSON.parse(cru) as ItemDiario[]) : []
  } catch {
    return []
  }
}

function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(itens))
  } catch {
    /* modo privado: segue só em memória */
  }
  ouvintes.forEach((f) => f())
}

export function adicionarItem(item: Omit<ItemDiario, 'id'>): string {
  const id = crypto.randomUUID()
  itens = [...itens, { ...item, id }]
  salvar()
  return id
}

export function removerItem(id: string) {
  itens = itens.filter((i) => i.id !== id)
  salvar()
}

export function copiarDia(de: string, para: string) {
  const origem = itens.filter((i) => i.data === de)
  itens = [
    ...itens.filter((i) => i.data !== para),
    ...origem.map((i) => ({ ...i, id: crypto.randomUUID(), data: para })),
  ]
  salvar()
}

// ─────────────────────────────────────────────────────────────

function inscrever(f: () => void) {
  ouvintes.add(f)
  return () => ouvintes.delete(f)
}

const VAZIO: ItemDiario[] = []
const cache = new Map<string, ItemDiario[]>()

/** Itens de um dia. Reage a qualquer mudança no diário. */
export function useDia(data: string): ItemDiario[] {
  const ler = useCallback(() => {
    const doDia = itens.filter((i) => i.data === data)
    if (doDia.length === 0) return VAZIO
    // useSyncExternalStore exige referência estável entre renders iguais
    const anterior = cache.get(data)
    if (anterior && anterior.length === doDia.length && anterior.every((a, n) => a.id === doDia[n].id)) {
      return anterior
    }
    cache.set(data, doDia)
    return doDia
  }, [data])

  return useSyncExternalStore(inscrever, ler, ler)
}

/** Datas que já têm algum registro — usado pelo ponto no seletor de dia. */
export function useDiasComRegistro(): Set<string> {
  const ler = useCallback(() => itens, [])
  const todos = useSyncExternalStore(inscrever, ler, ler)
  return new Set(todos.map((i) => i.data))
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
