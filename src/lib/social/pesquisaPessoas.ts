import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { normalizarBuscaPessoas } from './limites'
import type { PessoaSocial } from './seguidores'

const LIMITE_RESULTADOS = 20

export function usePesquisaPessoas(termo: string, ativa: boolean) {
  const [pessoas, setPessoas] = useState<PessoaSocial[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const busca = normalizarBuscaPessoas(termo)
    if (!ativa || busca.length < 2) {
      setPessoas([])
      setCarregando(false)
      setErro(null)
      return
    }

    let cancelado = false
    setCarregando(true)
    setErro(null)
    const temporizador = window.setTimeout(async () => {
      const { data, error } = await supabase
        .from('perfis_publicos')
        .select('id, nome, foto_url, bio')
        .ilike('nome', `%${busca}%`)
        .order('nome', { ascending: true })
        .limit(LIMITE_RESULTADOS)

      if (cancelado) return
      if (error) {
        setPessoas([])
        setErro('Não foi possível pesquisar pessoas agora.')
      } else {
        setPessoas((data ?? []) as PessoaSocial[])
      }
      setCarregando(false)
    }, 300)

    return () => {
      cancelado = true
      window.clearTimeout(temporizador)
    }
  }, [termo, ativa])

  return { pessoas, carregando, erro }
}
