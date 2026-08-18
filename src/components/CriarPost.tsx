import { useRef, useState } from 'react'
import { Camera, Dumbbell, X } from 'lucide-react'
import { Page } from './Page'
import { Empty } from './Empty'
import { useHistoricoTreinos, type TreinoHistorico } from '../lib/historicoTreinos'
import { criarPost } from '../lib/social/posts'

function formatoData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function CriarPost({
  userId,
  onFechar,
  onPublicado,
}: {
  userId: string
  onFechar: () => void
  onPublicado: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [legenda, setLegenda] = useState('')
  const [anexandoTreino, setAnexandoTreino] = useState(false)
  const [treinoEscolhido, setTreinoEscolhido] = useState<TreinoHistorico | null>(null)
  const [mostrarDuracao, setMostrarDuracao] = useState(true)
  const [mostrarSeries, setMostrarSeries] = useState(true)
  const [mostrarVolume, setMostrarVolume] = useState(true)
  const [publicando, setPublicando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const { treinos, carregando: carregandoTreinos } = useHistoricoTreinos(userId, 10)

  function escolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setArquivo(f)
    setPreview(URL.createObjectURL(f))
  }

  async function publicar() {
    if (!arquivo && legenda.trim().length === 0 && !treinoEscolhido) {
      setErro('Adicione uma foto, um texto ou um treino pra publicar.')
      return
    }
    setPublicando(true)
    setErro(null)
    try {
      await criarPost(userId, {
        legenda: legenda.trim(),
        arquivoFoto: arquivo,
        sessaoConcluidaId: treinoEscolhido?.id ?? null,
        mostrarDuracao,
        mostrarSeries,
        mostrarVolume,
      })
      onPublicado()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não deu pra publicar agora.')
    } finally {
      setPublicando(false)
    }
  }

  if (anexandoTreino) {
    return (
      <Page title="Anexar treino">
        <div className="mt-6 space-y-3">
          {carregandoTreinos ? (
            <Empty text="Carregando seus treinos..." />
          ) : treinos.length === 0 ? (
            <Empty text="Você ainda não concluiu nenhum treino." />
          ) : (
            treinos.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTreinoEscolhido(t)
                  setAnexandoTreino(false)
                }}
                className="flex w-full items-center justify-between rounded-xl border border-line bg-card px-4 py-3 text-left transition-colors hover:bg-card-hover"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{t.nome}</p>
                  <p className="text-xs text-ink-2">{formatoData(t.finalizadaEm)}</p>
                </div>
              </button>
            ))
          )}
          <button
            onClick={() => setAnexandoTreino(false)}
            className="h-11 w-full rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover"
          >
            Cancelar
          </button>
        </div>
      </Page>
    )
  }

  return (
    <Page title="Nova publicação">
      <div className="mt-6 space-y-5">
        <input ref={inputRef} type="file" accept="image/*" onChange={escolherFoto} className="hidden" />

        {preview ? (
          <div className="relative overflow-hidden rounded-2xl border border-line">
            <img src={preview} alt="Prévia" className="max-h-96 w-full object-cover" />
            <button
              onClick={() => {
                setArquivo(null)
                setPreview(null)
              }}
              aria-label="Remover foto"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-app/70 text-white"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-ink-3"
          >
            <Camera size={24} strokeWidth={1.75} />
            <span className="text-sm">Adicionar foto</span>
          </button>
        )}

        <textarea
          value={legenda}
          onChange={(e) => setLegenda(e.target.value)}
          placeholder="Escreva uma legenda..."
          rows={3}
          className="w-full resize-none rounded-xl border border-line bg-card-hover px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
        />

        {treinoEscolhido ? (
          <div className="rounded-xl border border-line bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-brand">
                <Dumbbell size={16} strokeWidth={1.75} />
                {treinoEscolhido.nome}
              </div>
              <button onClick={() => setTreinoEscolhido(null)} aria-label="Remover treino" className="text-ink-2">
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>
            <p className="mt-1 text-xs text-ink-2">{formatoData(treinoEscolhido.finalizadaEm)}</p>

            <div className="mt-3 space-y-2 border-t border-line pt-3">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">O que mostrar</p>
              {[
                { label: 'Duração', valor: mostrarDuracao, set: setMostrarDuracao },
                { label: 'Séries', valor: mostrarSeries, set: setMostrarSeries },
                { label: 'Volume', valor: mostrarVolume, set: setMostrarVolume },
              ].map(({ label, valor, set }) => (
                <button
                  key={label}
                  onClick={() => set(!valor)}
                  className={`h-9 rounded-full px-3 text-xs font-semibold transition-colors ${
                    valor ? 'bg-brand/15 text-brand' : 'border border-line text-ink-2'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAnexandoTreino(true)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover"
          >
            <Dumbbell size={16} strokeWidth={1.75} />
            Anexar treino
          </button>
        )}

        {erro && <p className="text-sm text-down">{erro}</p>}

        <button
          onClick={publicar}
          disabled={publicando}
          className="h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          {publicando ? 'Publicando...' : 'Publicar'}
        </button>
        <button
          onClick={onFechar}
          className="h-11 w-full rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover"
        >
          Cancelar
        </button>
      </div>
    </Page>
  )
}
