export type PosicaoResumoCorporal =
  | 'superior-esquerdo'
  | 'superior-direito'
  | 'inferior-esquerdo'
  | 'inferior-direito'
  | 'centro'

export type LayoutResumoCorporal = {
  alinhamento: CanvasTextAlign
  logoX: number
  logoY: number
  brasaoX: number
  brasaoY: number
  rankX: number
  rankY: number
  corpoX: number
  corpoY: number
}

export const POSICOES_RESUMO: Array<{ valor: PosicaoResumoCorporal; nome: string }> = [
  { valor: 'superior-esquerdo', nome: 'Superior esquerdo' },
  { valor: 'superior-direito', nome: 'Superior direito' },
  { valor: 'centro', nome: 'Centro' },
  { valor: 'inferior-esquerdo', nome: 'Inferior esquerdo' },
  { valor: 'inferior-direito', nome: 'Inferior direito' },
]

export function calcularLayoutResumo(posicao: PosicaoResumoCorporal): LayoutResumoCorporal {
  const direita = posicao.endsWith('direito')
  const centro = posicao === 'centro'
  const inferior = posicao.startsWith('inferior')

  const corpoX = centro ? 390 : direita ? 738 : 42
  const textoX = centro ? 540 : direita ? 1016 : 64
  const centroColuna = centro ? 540 : direita ? 916 : 164
  const inicioY = centro ? 520 : inferior ? 1040 : 104

  return {
    alinhamento: centro ? 'center' : direita ? 'right' : 'left',
    logoX: textoX,
    logoY: inicioY,
    brasaoX: centroColuna,
    brasaoY: inicioY + 108,
    rankX: textoX,
    rankY: inicioY + 212,
    corpoX,
    corpoY: inicioY + 250,
  }
}
