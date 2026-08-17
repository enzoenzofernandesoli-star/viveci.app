import { useEffect, useState } from 'react'
import { supabase } from './supabase.ts'
import { EXERCICIOS } from '../data/exercicios.ts'
import type { Rotina } from './rotinas.ts'
import {
  calcularVolumePorGrupo,
  calcularPercentuais,
  detectarDesequilibrios,
  detectarMusculoNegligenciado,
  type PercentualPorGrupo,
  type Desequilibrio,
  type MusculoNegligenciado,
} from './mapaCorporal.ts'
import { calcularDNA, interpretarDNA, type DNATreino, type PerfilDNA } from './dnaTreino.ts'
import { calcularConsistencia } from './consistencia.ts'
import { detectarEventosPR, type EventoPR } from './recordesPessoais.ts'
import { recomendarTreinoHoje, type RecomendacaoTreino } from './recomendacaoTreino.ts'
import { calcularDailyScore, type DailyScore } from './dailyScore.ts'

const DIA_MS = 24 * 60 * 60 * 1000

type RegistroBruto = { exercicio_id: number; peso_kg: number; reps: number; data: string }
type SessaoConcluidaBruta = { sessao_id: string | null; finalizada_em: string }

export type ResultadoVivici = {
  dna: DNATreino
  perfilDNA: PerfilDNA
  percentuaisSemana: PercentualPorGrupo
  desequilibrios: Desequilibrio[]
  musculoNegligenciado: MusculoNegligenciado | null
  recomendacao: RecomendacaoTreino | null
  eventosPR: EventoPR[]
  dailyScore: DailyScore
}

/**
 * VIVECI Intelligence Engine — motor central que cruza histórico de treino,
 * consistência e nutrição do dia pra gerar DNA de treino, recomendação de
 * treino do dia, alerta de músculo negligenciado, PRs recentes e Daily Score.
 * Tudo calculado por regras determinísticas sobre dados reais do usuário —
 * nada aqui é gerado por IA nem inventado quando faltam dados (fica zerado/neutro).
 */
export function useVivici(
  userId: string | undefined,
  rotinas: Rotina[],
  diasSemanaMeta: number | null,
  caloriasRegistradasHoje: number,
  metaCalorias: number,
) {
  const [resultado, setResultado] = useState<ResultadoVivici | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setCarregando(false)
      return
    }
    let cancelado = false
    setCarregando(true)
    setErro(null)

    async function carregar() {
      try {
        const noventaDiasAtras = new Date(Date.now() - 90 * DIA_MS).toISOString()

        const [{ data: registrosData, error: erroRegistros }, { data: sessoesData, error: erroSessoes }] =
          await Promise.all([
            supabase
              .from('registros')
              .select('exercicio_id, peso_kg, reps, data')
              .eq('user_id', userId!)
              .gte('data', noventaDiasAtras),
            supabase
              .from('sessoes_concluidas')
              .select('sessao_id, finalizada_em')
              .eq('user_id', userId!)
              .not('finalizada_em', 'is', null),
          ])
        if (erroRegistros) throw erroRegistros
        if (erroSessoes) throw erroSessoes

        const registros = (registrosData ?? []) as RegistroBruto[]
        const sessoes = (sessoesData ?? []) as SessaoConcluidaBruta[]
        const hojeISO = new Date().toISOString()

        const seteDiasAtras = new Date(Date.now() - 7 * DIA_MS).toISOString()
        const registros7d = registros.filter((r) => r.data >= seteDiasAtras)
        const volumes7d = calcularVolumePorGrupo(registros7d, EXERCICIOS)
        const percentuaisSemana = calcularPercentuais(volumes7d)
        const desequilibrios = detectarDesequilibrios(percentuaisSemana)
        const musculoNegligenciado = detectarMusculoNegligenciado(percentuaisSemana)

        const seriesParaDNA = registros
          .map((r) => {
            const exercicio = EXERCICIOS.find((e) => e.id === r.exercicio_id)
            return exercicio ? { ...r, grupo_muscular: exercicio.grupo_muscular } : null
          })
          .filter((s): s is NonNullable<typeof s> => s !== null)

        const datasConcluidas = sessoes.map((s) => s.finalizada_em)
        const { ultimos7Dias, ultimos30Dias } = calcularConsistencia(datasConcluidas, hojeISO)
        const dna = calcularDNA(seriesParaDNA, ultimos30Dias, hojeISO, diasSemanaMeta)
        const perfilDNA = interpretarDNA(dna)

        const eventosPR = detectarEventosPR(registros).filter((e) => e.atual.data >= seteDiasAtras)

        const ultimoTreinoPorRotina: Record<string, string | null> = {}
        for (const rotina of rotinas) {
          const datasDaRotina = sessoes.filter((s) => s.sessao_id === rotina.sessaoId).map((s) => s.finalizada_em)
          ultimoTreinoPorRotina[rotina.id] = datasDaRotina.length > 0 ? datasDaRotina.sort().at(-1)! : null
        }
        const rotinasParaRecomendacao = rotinas.map((r) => ({
          id: r.id,
          nome: r.nome,
          gruposMusculares: [...new Set(r.itens.map((i) => i.exercicio.grupo_muscular))],
        }))
        const recomendacao = recomendarTreinoHoje(rotinasParaRecomendacao, ultimoTreinoPorRotina, percentuaisSemana, hojeISO)

        const ultimoTreinoGeral = datasConcluidas.length > 0 ? datasConcluidas.sort().at(-1)! : null
        const diasSemTreinar = ultimoTreinoGeral
          ? Math.floor((Date.now() - new Date(ultimoTreinoGeral).getTime()) / DIA_MS)
          : 999
        const dailyScore = calcularDailyScore({
          diasSemTreinar,
          caloriasRegistradasHoje,
          metaCalorias,
          ultimos7Dias,
          ultimos30Dias,
          diasSemanaMeta: diasSemanaMeta ?? 3,
        })

        if (!cancelado) {
          setResultado({
            dna,
            perfilDNA,
            percentuaisSemana,
            desequilibrios,
            musculoNegligenciado,
            recomendacao,
            eventosPR,
            dailyScore,
          })
        }
      } catch (err) {
        if (!cancelado) setErro(err instanceof Error ? err.message : 'Não deu pra calcular sua análise agora.')
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, rotinas, diasSemanaMeta, caloriasRegistradasHoje, metaCalorias])

  return { resultado, carregando, erro }
}
