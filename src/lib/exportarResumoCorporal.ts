import type { RankCorporal } from './rankCorporal'
import { calcularLayoutResumo, type PosicaoResumoCorporal } from './posicaoResumoCorporal'

function desenharBrasao(ctx: CanvasRenderingContext2D, rank: RankCorporal, cx: number, cy: number, escala: number) {
  const pontos = [[0, -52], [44, -29], [44, 18], [0, 56], [-44, 18], [-44, -29]]
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(escala, escala)
  ctx.beginPath()
  pontos.forEach(([x, y], indice) => indice === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y))
  ctx.closePath()
  ctx.fillStyle = 'rgba(13,17,26,.86)'
  ctx.fill()
  ctx.strokeStyle = rank.cor
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-27, 20); ctx.lineTo(0, 47); ctx.lineTo(27, 20)
  ctx.stroke()
  if (rank.indice >= 2) {
    ctx.beginPath()
    ctx.moveTo(0, -30); ctx.lineTo(22, -8); ctx.lineTo(0, 28); ctx.lineTo(-22, -8); ctx.closePath()
    ctx.globalAlpha = .7
    ctx.stroke()
  }
  if (rank.indice >= 6) {
    ctx.globalAlpha = 1
    ctx.fillStyle = rank.cor
    ctx.beginPath()
    ctx.moveTo(0, -16); ctx.lineTo(10, -4); ctx.lineTo(0, 13); ctx.lineTo(-10, -4); ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

async function carregarSvg(svgOriginal: SVGSVGElement): Promise<HTMLImageElement> {
  const clone = svgOriginal.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', '520')
  clone.setAttribute('height', '920')

  const originais = svgOriginal.querySelectorAll<SVGElement>('*')
  const copias = clone.querySelectorAll<SVGElement>('*')
  originais.forEach((elemento, indice) => {
    const copia = copias[indice]
    if (!copia) return
    const estilo = getComputedStyle(elemento)
    copia.setAttribute('fill', estilo.fill)
    copia.setAttribute('fill-opacity', estilo.fillOpacity)
    copia.setAttribute('stroke', estilo.stroke)
    copia.setAttribute('stroke-width', estilo.strokeWidth)
  })

  const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const imagem = new Image()
    imagem.decoding = 'async'
    imagem.src = url
    await imagem.decode()
    return imagem
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function carregarFoto(arquivo: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(arquivo)
  try {
    const imagem = new Image()
    imagem.decoding = 'async'
    imagem.src = url
    await imagem.decode()
    return imagem
  } finally {
    URL.revokeObjectURL(url)
  }
}

function desenharFotoCobrindo(ctx: CanvasRenderingContext2D, imagem: HTMLImageElement, posicao: PosicaoResumoCorporal) {
  const escala = Math.max(1080 / imagem.naturalWidth, 1920 / imagem.naturalHeight)
  const largura = imagem.naturalWidth * escala
  const altura = imagem.naturalHeight * escala
  ctx.drawImage(imagem, (1080 - largura) / 2, (1920 - altura) / 2, largura, altura)
  if (posicao === 'centro') {
    const sombra = ctx.createRadialGradient(540, 960, 40, 540, 960, 520)
    sombra.addColorStop(0, 'rgba(7,10,16,.78)')
    sombra.addColorStop(1, 'rgba(7,10,16,0)')
    ctx.fillStyle = sombra
    ctx.fillRect(0, 360, 1080, 1200)
  } else {
    const direita = posicao.endsWith('direito')
    const sombra = ctx.createLinearGradient(direita ? 1080 : 0, 0, direita ? 460 : 620, 0)
    sombra.addColorStop(0, 'rgba(7,10,16,.86)')
    sombra.addColorStop(1, 'rgba(7,10,16,0)')
    ctx.fillStyle = sombra
    ctx.fillRect(direita ? 400 : 0, 0, 680, 1920)
  }
}

export async function exportarResumoCorporal({
  rank,
  mapaSvg,
  fotoFundo,
  posicao = 'inferior-esquerdo',
}: {
  rank: RankCorporal
  mapaSvg: SVGSVGElement
  fotoFundo?: File
  posicao?: PosicaoResumoCorporal
}) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Seu navegador não conseguiu criar a imagem.')

  if (fotoFundo) desenharFotoCobrindo(ctx, await carregarFoto(fotoFundo), posicao)

  const layout = calcularLayoutResumo(posicao)

  // Sem foto, o canvas continua transparente para uso em qualquer editor.
  // A assinatura visual fica compacta à esquerda para não cobrir a pessoa.
  ctx.textAlign = layout.alinhamento
  ctx.fillStyle = '#F4F5F7'
  ctx.font = '600 18px Sora, sans-serif'
  ctx.letterSpacing = '8px'
  ctx.fillText('VIVECI', layout.logoX, layout.logoY)
  ctx.letterSpacing = '0px'

  desenharBrasao(ctx, rank, layout.brasaoX, layout.brasaoY, 1.02)
  ctx.fillStyle = rank.cor
  ctx.font = '700 30px Sora, sans-serif'
  ctx.fillText(rank.nome.toUpperCase(), layout.rankX, layout.rankY)

  const imagemCorpo = await carregarSvg(mapaSvg)
  ctx.drawImage(imagemCorpo, layout.corpoX, layout.corpoY, 300, 531)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((resultado) => resultado ? resolve(resultado) : reject(new Error('Não foi possível gerar o PNG.')), 'image/png')
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `viveci-mapa-${new Date().toISOString().slice(0, 10)}.png`
  link.click()
  URL.revokeObjectURL(url)
}
