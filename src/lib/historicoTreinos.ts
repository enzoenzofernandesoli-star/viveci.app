import { useEffect, useState } from 'react'
import { supabase } from './supabase.ts'

export type TreinoHistorico = {
  id: string
  nome: string
  finalizadaEm: string
  volumeTotalKg: number | null
  duracaoSeg: number | null
}

/** Últimos treinos concluídos do usuário, com o nome da rotina (ou "Treino rápido"). */
export function useHistoricoTreinos(userId: string | undefined, limite = 20) {
  const [treinos, setTreinos] = useState<TreinoHistorico[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setCarregando(false)
      return
    }
    let cancelado = false

    async function carregar() {
      try {
        setCarregando(true)
        setErro(null)

        const { data: sessoes, error: erroSessoes } = await supabase
          .from('sessoes_concluidas')
          .select('*')
          .eq('user_id', userId!)
          .not('finalizada_em', 'is', null)
          .order('finalizada_em', { ascending: false })
          .limit(limite)
        if (erroSessoes) throw erroSessoes

        const idsSessao = [...new Set(sessoes.map((s) => s.sessao_id).filter(Boolean))]
        let nomePorSessao = new Map<string, string>()

        if (idsSessao.length > 0) {
          const { data: planoSessoes, error: erroPS } = await supabase
            .from('plano_sessoes')
            .select('id, plano_id')
            .in('id', idsSessao)
          if (erroPS) throw erroPS

          const idsPlano = [...new Set(planoSessoes.map((p) => p.plano_id))]
          const { data: planos, error: erroPlanos } = await supabase.from('planos').select('id, nome').in('id', idsPlano)
          if (erroPlanos) throw erroPlanos

          const nomePorPlano = new Map(planos.map((p) => [p.id, p.nome as string]))
          nomePorSessao = new Map(planoSessoes.map((p) => [p.id, nomePorPlano.get(p.plano_id) ?? 'Rotina']))
        }

        const montados = sessoes.map((s) => ({
          id: s.id,
          nome: s.sessao_id ? (nomePorSessao.get(s.sessao_id) ?? 'Rotina') : 'Treino rápido',
          finalizadaEm: s.finalizada_em,
          volumeTotalKg: s.volume_total_kg,
          duracaoSeg: s.duracao_seg,
        }))

        if (!cancelado) setTreinos(montados)
      } catch (err) {
        if (!cancelado) setErro(err instanceof Error ? err.message : 'Não deu pra carregar seu histórico.')
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [userId, limite])

  return { treinos, carregando, erro }
}
