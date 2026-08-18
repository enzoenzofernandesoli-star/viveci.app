import { Button } from './ui/Button'

/** Estado vazio padrão. Toda tela sem dados usa este componente. */
export function Empty({ text, action }: { text: string; action?: string }) {
  const carregando = text.startsWith('Carregando')

  return (
    <div className="animar-entrada mt-6 border-y border-line/60 px-6 py-12 text-center" role={carregando ? 'status' : undefined} aria-live={carregando ? 'polite' : undefined}>
      {carregando && (
        <div className="mx-auto mb-3 flex size-2 items-center justify-center">
          <span className="size-2 rounded-full bg-brand animar-pulso" aria-hidden="true" />
        </div>
      )}
      <p className="text-sm text-ink-2">{text}</p>
      {action && <Button className="mt-5">{action}</Button>}
    </div>
  )
}
