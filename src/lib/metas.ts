import type { Perfil } from './perfil'

export type Metas = {
  tmb: number
  get: number
  fator_atividade: number
  meta_kcal: number
  meta_prot_g: number
  meta_carb_g: number
  meta_gord_g: number
  /** true quando o piso de segurança elevou a meta acima do valor calculado */
  meta_limitada: boolean
  /** true quando o carboidrato ficou abaixo de 2 g/kg mesmo após reduzir a gordura */
  low_carb: boolean
}

/** Fator de atividade a partir da frequência semanal de treino. */
function fatorAtividade(dias: number): number {
  if (dias <= 1) return 1.2
  if (dias === 2) return 1.375
  if (dias <= 4) return 1.55
  if (dias === 5) return 1.725
  return 1.9
}

const AJUSTE_OBJETIVO = {
  emagrecer: 0.8,
  definir: 0.9,
  condicionamento: 1,
  forca: 1.1,
  ganhar_massa: 1.15,
} as const

/** Proteína em gramas por quilo de peso corporal. */
const PROTEINA_G_KG = {
  emagrecer: 2.2,
  definir: 2.2,
  condicionamento: 1.6,
  forca: 2.0,
  ganhar_massa: 1.9,
} as const

const arredonda5 = (n: number) => Math.round(n / 5) * 5
const arredonda10 = (n: number) => Math.round(n / 10) * 10

/**
 * Meta calórica e distribuição de macros a partir do perfil.
 * Função pura: mesmo perfil, mesmo resultado. Sem efeito colateral, sem I/O.
 */
export function calcularMetas(perfil: Perfil): Metas {
  const { sexo, idade, altura_cm, peso_kg, dias_semana, objetivo } = perfil

  // 1. Taxa metabólica basal — Mifflin-St Jeor
  const base = 10 * peso_kg + 6.25 * altura_cm - 5 * idade
  const tmb = sexo === 'masculino' ? base + 5 : base - 161

  // 2. Gasto energético total
  const fator = fatorAtividade(dias_semana)
  const get = tmb * fator

  // 3. Ajuste por objetivo, com pisos de segurança
  const alvo = get * AJUSTE_OBJETIVO[objetivo]
  const pisoSexo = sexo === 'masculino' ? 1500 : 1200
  const piso = Math.max(tmb * 1.1, pisoSexo)
  const meta_limitada = alvo < piso
  // O piso é arredondado para cima: arredondar para o múltiplo mais próximo
  // poderia devolver um valor logo abaixo do mínimo de segurança.
  const meta_kcal = meta_limitada
    ? Math.ceil(piso / 10) * 10
    : arredonda10(alvo)

  // 4. Macros: proteína → gordura → carboidrato como resto
  const prot_g = arredonda5(peso_kg * PROTEINA_G_KG[objetivo])
  let gord_g = arredonda5(Math.max((meta_kcal * 0.25) / 9, peso_kg * 0.8))
  let carb_g = arredonda5((meta_kcal - prot_g * 4 - gord_g * 9) / 4)

  // Carboidrato muito baixo: recua a gordura até o piso antes de aceitar
  const pisoGordura = arredonda5(peso_kg * 0.8)
  if (carb_g < peso_kg * 2 && gord_g > pisoGordura) {
    gord_g = pisoGordura
    carb_g = arredonda5((meta_kcal - prot_g * 4 - gord_g * 9) / 4)
  }
  const low_carb = carb_g < peso_kg * 2

  return {
    tmb: Math.round(tmb * 10) / 10,
    get: Math.round(get),
    fator_atividade: fator,
    meta_kcal,
    meta_prot_g: prot_g,
    meta_carb_g: Math.max(carb_g, 0),
    meta_gord_g: gord_g,
    meta_limitada,
    low_carb,
  }
}
