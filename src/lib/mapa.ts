import { useEffect, useState } from 'react'
import { supabase } from './supabase.ts'
import { EXERCICIOS } from '../data/exercicios.ts'
import {
  calcularVolumePorGrupo,
  calcularPercentuais,
  detectarDesequilibrios,
  type PercentualPorGrupo,
  type Desequilibrio,
} from './mapaCorporal.ts'

function seteDiasAtrasISO(): string {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString()
}

/** Percentual de volume por grupo muscular dos últimos 7 dias + alertas de desequilíbrio. */
export function useMapaMuscular(userId: string | undefined) {
  const [percentuais, setPercentuais] = useState<PercentualPorGrupo | null>(null)
  const [desequilibrios, setDesequilibrios] = useState<Desequilibrio[]>([])
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

    supabase
      .from('registros')
      .select('exercicio_id, peso_kg, reps')
      .eq('user_id', userId)
      .gte('data', seteDiasAtrasISO())
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) {
          setErro(error.message)
          setCarregando(false)
          return
        }
        const volumes = calcularVolumePorGrupo(data ?? [], EXERCICIOS)
        const pct = calcularPercentuais(volumes)
        setPercentuais(pct)
        setDesequilibrios(detectarDesequilibrios(pct))
        setCarregando(false)
      })

    return () => {
      cancelado = true
    }
  }, [userId])

  return { percentuais, desequilibrios, carregando, erro }
}
