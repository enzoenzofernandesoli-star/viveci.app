const LARGURA = 300
const ALTURA = 120
const PAD = 10

export function GraficoLinha({ valores }: { valores: number[] }) {
  if (valores.length === 0) return null

  const min = Math.min(...valores)
  const max = Math.max(...valores)
  const alcance = max - min || 1

  const pontoX = (i: number) => (valores.length === 1 ? LARGURA / 2 : PAD + (i / (valores.length - 1)) * (LARGURA - PAD * 2))
  const pontoY = (v: number) => ALTURA - PAD - ((v - min) / alcance) * (ALTURA - PAD * 2)

  const linha = valores.map((v, i) => `${pontoX(i)},${pontoY(v)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="h-28 w-full">
      <polyline
        points={linha}
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {valores.map((v, i) => (
        <circle key={i} cx={pontoX(i)} cy={pontoY(v)} r="3" fill="var(--color-brand)" />
      ))}
    </svg>
  )
}
