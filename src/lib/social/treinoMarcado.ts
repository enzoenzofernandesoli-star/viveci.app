export type DadosTreinoMarcado = {
  local: string
  dataHora: string
}

export function validarTreinoMarcado(dados: DadosTreinoMarcado, agora = new Date()): string | null {
  const local = dados.local.trim()
  if (local.length < 2) return 'Informe onde será o treino.'
  if (local.length > 120) return 'O local deve ter no máximo 120 caracteres.'

  const data = new Date(dados.dataHora)
  if (Number.isNaN(data.getTime())) return 'Informe a data e o horário do treino.'
  if (data.getTime() <= agora.getTime()) return 'Escolha um horário futuro.'
  if (data.getTime() > agora.getTime() + 366 * 24 * 60 * 60 * 1000) return 'Escolha uma data dentro dos próximos 12 meses.'
  return null
}

export function formatarDataHoraTreino(dataHora: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(dataHora)).replace('.', '')
}
