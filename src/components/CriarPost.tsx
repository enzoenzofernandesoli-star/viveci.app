import { useEffect, useRef, useState } from 'react'
import { Camera, Dumbbell, X } from 'lucide-react'
import { Page } from './Page'
import { Empty } from './Empty'
import { useHistoricoTreinos, type TreinoHistorico } from '../lib/historicoTreinos'
import { criarPost } from '../lib/social/posts'
import { LIMITE_LEGENDA } from '../lib/social/limites'
import { mensagemErro } from '../lib/mensagemErro'

function formatoData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function CriarPost({
  userId,
  onFechar,
  onPublicado,
  sessaoInicialId,
}: {
  userId: string
  onFechar: () => void
  onPublicado: () => void
  sessaoInicialId?: string | null
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
  const publicacaoEmCurso = useRef(false)

  const { treinos, carregando: carregandoTreinos } = useHistoricoTreinos(userId, 10)

  useEffect(() => {
    if (!sessaoInicialId || treinoEscolhido || carregandoTreinos) return
    const treino = treinos.find((item) => item.id === sessaoInicialId)
    if (treino) setTreinoEscolhido(treino)
  }, [sessaoInicialId, treinoEscolhido, carregandoTreinos, treinos])

  function escolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setArquivo(f)
    setPreview(URL.createObjectURL(f))
  }

  async function publicar() {
    if (publicacaoEmCurso.current) return
    if (!arquivo && legenda.trim().length === 0 && !treinoEscolhido) {
      setErro('Adicione uma foto, um texto ou um treino pra publicar.')
      return
    }
    publicacaoEmCurso.current = true
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
      setErro(mensagemErro(err, 'Não deu pra publicar agora. Tente novamente.'))
    } finally {
      publicacaoEmCurso.current = false
      setPublicando(false)
    }
  }

  if (anexandoTreino) {
    return (
      <Page title="Anexar treino">
        <div className="mt-6 divide-y divide-line/60 border-y border-line/60">
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
                className="flex min-h-16 w-full items-center justify-between py-3 text-left transition-colors hover:text-brand"
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
            className="mt-4 h-11 w-full text-sm font-semibold text-ink-2 transition-colors hover:text-ink"
          >
            Cancelar
          </button>
        </div>
      </Page>
    )
  }

  return (
    <Page title="Nova publicação">
      <div className="mt-6 space-y-7">
        <input ref={inputRef} type="file" accept="image/*" onChange={escolherFoto} className="hidden" />

        {preview ? (
          <div className="relative overflow-hidden rounded-2xl">
            <img src={preview} alt="Prévia" className="max-h-96 w-full object-cover" />
            <button
              onClick={() => {
                setArquivo(null)
                setPreview(null)
              }}
              aria-label="Remover foto"
              className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full bg-app/70 text-white"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        ) : (
          <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-2">1 · Adicionar foto</p>
          <button
            onClick={() => inputRef.current?.click()}
            className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-ink-3"
          >
            <Camera size={24} strokeWidth={1.75} />
            <span className="text-sm">Adicionar foto</span>
          </button></div>
        )}

        <label className="block"><span className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-2">2 · Escrever legenda</span><textarea
          value={legenda}
          onChange={(e) => setLegenda(e.target.value)}
          placeholder="Escreva uma legenda..."
          rows={3}
          maxLength={LIMITE_LEGENDA}
          className="w-full resize-none border-y border-line/60 bg-transparent px-0 py-3 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
        /></label>

        {treinoEscolhido ? (
          <div className="border-y border-line/60 py-4">
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

            <div className="mt-3 border-t border-line/60 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-2">4 · Compartilhar</p>
              <div className="mt-2 divide-y divide-line/60">
              {[
                { label: 'Duração', valor: mostrarDuracao, set: setMostrarDuracao },
                { label: 'Séries', valor: mostrarSeries, set: setMostrarSeries },
                { label: 'Volume', valor: mostrarVolume, set: setMostrarVolume },
              ].map(({ label, valor, set }) => (
                <button
                  key={label}
                  onClick={() => set(!valor)}
                  className="flex min-h-11 w-full items-center justify-between text-xs font-semibold text-ink-2"
                >
                  <span>{label}</span><span className={valor ? 'text-brand' : 'text-ink-3'}>{valor ? '✓' : '○'}</span>
                </button>
              ))}
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAnexandoTreino(true)}
            className="flex min-h-14 w-full items-center justify-between border-y border-line/60 text-sm font-semibold text-ink-2 transition-colors hover:text-ink"
          >
            <span className="flex items-center gap-2"><Dumbbell size={16} strokeWidth={1.75} />3 · Vincular treino</span><span className="text-xs text-ink-3">Opcional</span>
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
          className="h-11 w-full text-sm font-semibold text-ink-2 transition-colors hover:text-ink"
        >
          Cancelar
        </button>
      </div>
    </Page>
  )
}
