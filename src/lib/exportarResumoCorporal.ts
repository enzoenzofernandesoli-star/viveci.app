import type { RankCorporal } from './rankCorporal'

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

export async function exportarResumoCorporal({
  rank,
  mapaSvg,
}: {
  rank: RankCorporal
  mapaSvg: SVGSVGElement
}) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Seu navegador não conseguiu criar a imagem.')

  // O canvas começa transparente de propósito: a imagem pode ser colocada
  // sobre qualquer foto em um editor de Stories.
  ctx.textAlign = 'center'
  ctx.fillStyle = '#F4F5F7'
  ctx.font = '600 22px Sora, sans-serif'
  ctx.letterSpacing = '10px'
  ctx.fillText('VIVECI', 540, 104)
  ctx.letterSpacing = '0px'

  desenharBrasao(ctx, rank, 540, 290, 1.65)
  ctx.fillStyle = rank.cor
  ctx.font = '700 52px Sora, sans-serif'
  ctx.fillText(rank.nome.toUpperCase(), 540, 425)

  const imagemCorpo = await carregarSvg(mapaSvg)
  ctx.drawImage(imagemCorpo, 230, 500, 620, 1097)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((resultado) => resultado ? resolve(resultado) : reject(new Error('Não foi possível gerar o PNG.')), 'image/png')
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `viveci-corpo-${new Date().toISOString().slice(0, 10)}.png`
  link.click()
  URL.revokeObjectURL(url)
}
