import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PercentualPorGrupo } from '../lib/mapaCorporal.ts'
import { EditorialMedia } from './ui/EditorialMedia.tsx'
import { MapaEstimuloSocial } from './MapaEstimuloSocial.tsx'

export function CarrosselPost({ fotoUrl, autor, percentuais }: { fotoUrl: string | null; autor: string; percentuais: PercentualPorGrupo | null }) {
  const ref = useRef<HTMLDivElement>(null)
  const [ativo, setAtivo] = useState(0)
  const total = Number(Boolean(fotoUrl)) + Number(Boolean(percentuais))

  function irPara(indice: number) {
    const destino = Math.max(0, Math.min(total - 1, indice))
    ref.current?.scrollTo({ left: destino * ref.current.clientWidth, behavior: 'smooth' })
    setAtivo(destino)
  }

  if (total === 0) return null
  return (
    <div className="relative mt-4 overflow-hidden rounded-2xl border border-line/60">
      <div ref={ref} onScroll={(evento) => setAtivo(Math.round(evento.currentTarget.scrollLeft / evento.currentTarget.clientWidth))} className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {fotoUrl && <div className="aspect-[4/5] max-h-[620px] min-w-full snap-center"><EditorialMedia src={fotoUrl} alt={`Publicação de ${autor}`} className="h-full w-full" /></div>}
        {percentuais && <div className="aspect-[4/5] max-h-[620px] min-w-full snap-center"><MapaEstimuloSocial percentuais={percentuais} /></div>}
      </div>
      {total > 1 && <>
        {ativo > 0 && <button onClick={() => irPara(ativo - 1)} aria-label="Imagem anterior" className="absolute left-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-app/75 text-ink"><ChevronLeft size={18} /></button>}
        {ativo < total - 1 && <button onClick={() => irPara(ativo + 1)} aria-label="Próxima imagem" className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-app/75 text-ink"><ChevronRight size={18} /></button>}
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">{Array.from({ length: total }, (_, indice) => <span key={indice} className={`size-1.5 rounded-full ${indice === ativo ? 'bg-brand' : 'bg-ink/45'}`} />)}</div>
      </>}
    </div>
  )
}
