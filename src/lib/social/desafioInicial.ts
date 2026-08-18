export type TarefaDesafioInicial = { chave: string; label: string; concluida: boolean }
export type DesafioInicial = { tarefas: TarefaDesafioInicial[]; percentual: number }

export type EntradaDesafioInicial = {
  onboardingCompleto: boolean
  temRotinaCriada: boolean
  temTreinoConcluido: boolean
  temPost: boolean
}

/**
 * Progresso real do "desafio inicial" mostrado no Social — nunca um número
 * fixo. 4 tarefas de peso igual (25% cada): completar o perfil, criar a
 * primeira rotina, concluir o primeiro treino, publicar a primeira vez.
 */
export function calcularDesafioInicial(entrada: EntradaDesafioInicial): DesafioInicial {
  const tarefas: TarefaDesafioInicial[] = [
    { chave: 'onboarding', label: 'Complete seu perfil', concluida: entrada.onboardingCompleto },
    { chave: 'rotina', label: 'Crie sua primeira rotina', concluida: entrada.temRotinaCriada },
    { chave: 'treino', label: 'Complete seu primeiro treino', concluida: entrada.temTreinoConcluido },
    { chave: 'post', label: 'Publique pela primeira vez', concluida: entrada.temPost },
  ]
  const concluidas = tarefas.filter((t) => t.concluida).length
  const percentual = Math.round((concluidas / tarefas.length) * 100)
  return { tarefas, percentual }
}
