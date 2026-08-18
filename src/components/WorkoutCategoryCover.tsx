import type { CategoriaTreino } from '../lib/categoriaTreino'

const FOTOS = import.meta.glob('../assets/viveci/workouts/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const ROTULOS: Record<CategoriaTreino, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  fullbody: 'Full body',
}

function fotoCategoria(categoria: CategoriaTreino | null): string | null {
  if (!categoria) return null
  const entrada = Object.entries(FOTOS).find(([caminho]) => caminho.toLowerCase().includes(`/${categoria}.`))
  return entrada?.[1] ?? null
}

export function WorkoutCategoryCover({ categoria }: { categoria: CategoriaTreino | null }) {
  const foto = fotoCategoria(categoria)
  return (
    <div className="relative aspect-[16/9] overflow-hidden bg-card-hover md:aspect-auto md:min-h-44">
      {foto ? (
        <img src={foto} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute inset-y-0 left-[28%] w-px rotate-12 bg-line" />
          <div className="absolute inset-y-0 left-[55%] w-px rotate-12 bg-line/60" />
          <span className="absolute bottom-4 left-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">
            {categoria ? ROTULOS[categoria] : 'Rotina'}
          </span>
        </div>
      )}
    </div>
  )
}
