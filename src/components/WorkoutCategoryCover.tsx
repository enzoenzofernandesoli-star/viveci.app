import { useEffect, useState } from 'react'
import { arquivoCategoriaTreino, type CategoriaVisualTreino } from '../lib/categoriaTreino'

const FOTOS = import.meta.glob('../assets/viveci/workouts/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const ROTULOS: Record<CategoriaVisualTreino, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  fullbody: 'Full body',
  cardio: 'Cardio',
}

function fotoCategoria(categoria: CategoriaVisualTreino | null): string | null {
  if (!categoria) return null
  const arquivo = arquivoCategoriaTreino(categoria)
  if (!arquivo) return null
  const entrada = Object.entries(FOTOS).find(([caminho]) => caminho.toLowerCase().endsWith(`/${arquivo}`))
  return entrada?.[1] ?? null
}

export function WorkoutCategoryCover({ categoria }: { categoria: CategoriaVisualTreino | null }) {
  const foto = fotoCategoria(categoria)
  const [falhou, setFalhou] = useState(false)
  const [carregou, setCarregou] = useState(false)

  useEffect(() => {
    setFalhou(false)
    setCarregou(false)
  }, [categoria, foto])

  const rotulo = categoria ? ROTULOS[categoria] : 'Rotina'

  return (
    <div
      className="relative aspect-[5/3] overflow-hidden rounded-media bg-card-hover"
      role="img"
      aria-label={`Categoria de treino: ${rotulo}`}
    >
      {(!foto || falhou) && (
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute inset-y-0 left-[28%] w-px rotate-12 bg-line" />
          <div className="absolute inset-y-0 left-[55%] w-px rotate-12 bg-line/60" />
          <span className="absolute bottom-4 left-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">
            {rotulo}
          </span>
        </div>
      )}
      {foto && !falhou && (
        <img
          src={foto}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setCarregou(true)}
          onError={() => setFalhou(true)}
          className={`relative h-full w-full object-cover object-center transition-opacity duration-200 ${carregou ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {foto && !falhou && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-app/65" aria-hidden="true" />}
    </div>
  )
}
