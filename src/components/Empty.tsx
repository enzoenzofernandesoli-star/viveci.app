/** Estado vazio padrão. Toda tela sem dados usa este componente. */
export function Empty({ text, action }: { text: string; action?: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-line bg-card px-6 py-12 text-center">
      <p className="text-sm text-ink-2">{text}</p>
      {action && (
        <button className="mt-4 h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover">
          {action}
        </button>
      )}
    </div>
  )
}
