import { GRUPOS_MUSCULARES, type PercentualPorGrupo } from './mapaCorporal'
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
  nome,
  rank,
  percentuais,
  mapaSvg,
}: {
  nome: string
  rank: RankCorporal
  percentuais: PercentualPorGrupo
  mapaSvg: SVGSVGElement
}) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Seu navegador não conseguiu criar a imagem.')

  ctx.shadowColor = 'rgba(0,0,0,.9)'
  ctx.shadowBlur = 14
  ctx.fillStyle = '#F4F5F7'
  ctx.font = '600 24px Sora, sans-serif'
  ctx.letterSpacing = '9px'
  ctx.fillText('VIVECI', 92, 110)
  ctx.letterSpacing = '0px'
  ctx.fillStyle = '#7E8795'
  ctx.font = '500 18px Sora, sans-serif'
  ctx.fillText('MAPA DE ESTÍMULO · ÚLTIMOS 7 DIAS', 92, 158)

  desenharBrasao(ctx, rank, 183, 306, 1.35)
  ctx.fillStyle = rank.cor
  ctx.font = '700 58px Sora, sans-serif'
  ctx.fillText(rank.nome.toUpperCase(), 292, 292)
  ctx.fillStyle = '#F4F5F7'
  ctx.font = '600 24px Sora, sans-serif'
  ctx.fillText(nome || 'Atleta VIVECI', 294, 334)
  ctx.fillStyle = '#7E8795'
  ctx.font = '500 19px Sora, sans-serif'
  ctx.fillText(`Média semanal ${rank.mediaSemanal}%`, 294, 370)

  ctx.fillStyle = 'rgba(32,39,53,.9)'
  ctx.fillRect(92, 426, 896, 8)
  ctx.fillStyle = rank.cor
  ctx.fillRect(92, 426, 896 * (rank.progressoNoRank / 100), 8)
  ctx.fillStyle = '#BFC3CA'
  ctx.font = '500 17px Sora, sans-serif'
  ctx.fillText(rank.proximoRank ? `${rank.pontosParaProximo} pontos para ${rank.proximoRank}` : 'Rank máximo alcançado', 92, 470)

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  const imagemCorpo = await carregarSvg(mapaSvg)
  ctx.drawImage(imagemCorpo, 535, 500, 410, 720)

  const destaque = [...GRUPOS_MUSCULARES]
    .sort((a, b) => percentuais[b] - percentuais[a])
    .slice(0, 5)
  ctx.fillStyle = '#7E8795'
  ctx.shadowColor = 'rgba(0,0,0,.9)'
  ctx.shadowBlur = 10
  ctx.font = '600 16px Sora, sans-serif'
  ctx.fillText('GRUPOS MAIS ESTIMULADOS', 92, 566)
  destaque.forEach((grupo, indice) => {
    const y = 626 + indice * 102
    ctx.fillStyle = '#F4F5F7'
    ctx.font = '600 21px Sora, sans-serif'
    ctx.fillText(grupo, 92, y)
    ctx.fillStyle = '#BFC3CA'
    ctx.font = '500 17px Sora, sans-serif'
    ctx.fillText(`${percentuais[grupo]}%`, 414, y)
    ctx.fillStyle = 'rgba(32,39,53,.9)'
    ctx.fillRect(92, y + 22, 360, 6)
    ctx.fillStyle = '#0066FF'
    ctx.fillRect(92, y + 22, 360 * (percentuais[grupo] / 100), 6)
  })

  ctx.fillStyle = '#7E8795'
  ctx.font = '500 16px Sora, sans-serif'
  ctx.fillText('TREINE · EVOLUA · CONQUISTE', 92, 1252)

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
