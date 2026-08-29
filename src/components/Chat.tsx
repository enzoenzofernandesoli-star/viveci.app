import { useCallback, useEffect, useRef, useState } from 'react'
import { CalendarDays, Camera, Check, Clock3, Dumbbell, Image, MapPin, Mic, Paperclip, Pause, Play, Send, Square, Trash2, Users, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSessao } from '../lib/auth'
import { useHistoricoTreinos } from '../lib/historicoTreinos'
import { Modal } from './Modal'
import { aceitarConviteGrupo, enviarMensagem, enviarMidia, excluirMensagem, listarMensagens, marcarMensagensComoLidas, marcarTreino, obterUrlMidia, participarTreino, recusarConviteGrupo, type Mensagem } from '../lib/social/mensagens'
import { formatarDataHoraTreino, validarTreinoMarcado } from '../lib/social/treinoMarcado'
import { capturarFotoNativa } from '../lib/cameraNativa'

type ChatProps = { conversaId?: string; grupoId?: string; mostrarAutores?: boolean }

function formatarDuracao(segundos: number) {
  if (!Number.isFinite(segundos) || segundos < 0) return '0:00'
  return `${Math.floor(segundos / 60)}:${String(Math.floor(segundos % 60)).padStart(2, '0')}`
}

const ONDAS_AUDIO = [8, 13, 19, 11, 23, 17, 29, 15, 25, 32, 18, 27, 35, 22, 30, 17, 26, 34, 20, 28, 14, 24, 31, 18, 26, 12]

function PlayerAudio({ url, midiaPath, minha, fotoUrl, nome, modoPrevia = false }: { url?: string | null; midiaPath?: string | null; minha: boolean; fotoUrl?: string | null; nome?: string; modoPrevia?: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const playerIdRef = useRef(`audio-${Math.random().toString(36).slice(2)}`)
  const recuperandoRef = useRef(false)
  const tentativasRef = useRef(0)
  const ultimoAvancoRef = useRef({ posicao: 0, instante: Date.now() })
  const [urlAtiva, setUrlAtiva] = useState(url ?? null)
  const [tocando, setTocando] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [duracao, setDuracao] = useState(0)
  const [posicao, setPosicao] = useState(0)
  const [falhou, setFalhou] = useState(false)

  useEffect(() => { setUrlAtiva(url ?? null) }, [url])

  useEffect(() => {
    const pausarOutroPlayer = (evento: Event) => {
      if ((evento as CustomEvent<string>).detail !== playerIdRef.current) audioRef.current?.pause()
    }
    window.addEventListener('viveci:reproduzir-audio', pausarOutroPlayer)
    return () => window.removeEventListener('viveci:reproduzir-audio', pausarOutroPlayer)
  }, [])

  async function garantirUrl() {
    if (urlAtiva) return urlAtiva
    if (!midiaPath) throw new Error('Áudio indisponível.')
    const novaUrl = await obterUrlMidia(midiaPath)
    setUrlAtiva(novaUrl)
    return novaUrl
  }

  async function alternar() {
    const audio = audioRef.current
    if (!audio) return
    try {
      const endereco = await garantirUrl()
      if (audio.src !== endereco) { audio.src = endereco; audio.load() }
      if (audio.paused) {
        window.dispatchEvent(new CustomEvent('viveci:reproduzir-audio', { detail: playerIdRef.current }))
        tentativasRef.current = 0
        await audio.play()
      }
      else audio.pause()
    } catch { setFalhou(true) }
  }

  const recuperarReproducao = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || !midiaPath || recuperandoRef.current || audio.ended || tentativasRef.current >= 2) {
      if (audio && tentativasRef.current >= 2) audio.pause()
      return
    }
    recuperandoRef.current = true
    tentativasRef.current += 1
    setCarregando(true)
    const ponto = audio.currentTime
    try {
      const novaUrl = await obterUrlMidia(midiaPath)
      setUrlAtiva(novaUrl)
      audio.src = novaUrl
      audio.load()
      await new Promise<void>((resolve, reject) => {
        const pronto = () => { limpar(); resolve() }
        const falha = () => { limpar(); reject(new Error('Falha ao recarregar áudio.')) }
        const tempo = window.setTimeout(falha, 8000)
        const limpar = () => { window.clearTimeout(tempo); audio.removeEventListener('canplay', pronto); audio.removeEventListener('error', falha) }
        audio.addEventListener('canplay', pronto, { once: true })
        audio.addEventListener('error', falha, { once: true })
      })
      if (Number.isFinite(audio.duration)) audio.currentTime = Math.min(ponto, Math.max(0, audio.duration - 0.1))
      ultimoAvancoRef.current = { posicao: audio.currentTime, instante: Date.now() }
      await audio.play()
      setFalhou(false)
    } catch {
      audio.pause()
      setFalhou(true)
    } finally {
      recuperandoRef.current = false
      setCarregando(false)
    }
  }, [midiaPath])

  useEffect(() => {
    if (!tocando) return
    const fiscal = window.setInterval(() => {
      const audio = audioRef.current
      if (!audio || audio.paused || audio.ended || recuperandoRef.current) return
      if (audio.currentTime > ultimoAvancoRef.current.posicao + 0.05) {
        ultimoAvancoRef.current = { posicao: audio.currentTime, instante: Date.now() }
      } else if (Date.now() - ultimoAvancoRef.current.instante > 4500) {
        void recuperarReproducao()
      }
    }, 1000)
    return () => window.clearInterval(fiscal)
  }, [tocando, recuperarReproducao])

  const percentual = duracao > 0 ? Math.min(100, (posicao / duracao) * 100) : 0

  return <div onClick={() => void alternar()} className={`mt-1 flex min-w-[230px] cursor-pointer items-center gap-2.5 ${modoPrevia ? '' : 'py-0.5'}`}>
    <audio ref={audioRef} src={urlAtiva ?? undefined} preload="metadata" onLoadedMetadata={(e) => { setDuracao(e.currentTarget.duration); setFalhou(false) }} onTimeUpdate={(e) => { setPosicao(e.currentTarget.currentTime); ultimoAvancoRef.current = { posicao: e.currentTarget.currentTime, instante: Date.now() } }} onPlay={() => { setTocando(true); setCarregando(false); ultimoAvancoRef.current = { posicao: audioRef.current?.currentTime ?? 0, instante: Date.now() } }} onPlaying={() => setCarregando(false)} onWaiting={() => setCarregando(true)} onPause={() => { setTocando(false); setCarregando(false) }} onEnded={(e) => { setTocando(false); setCarregando(false); setPosicao(0); e.currentTarget.currentTime = 0 }} onError={() => { if (!recuperandoRef.current) setUrlAtiva(null); setTocando(false); setCarregando(false); setFalhou(true) }} />
    {!modoPrevia && <div className="relative flex size-12 shrink-0 items-center justify-center overflow-visible rounded-full border border-white/15 bg-app/40">{fotoUrl ? <img src={fotoUrl} alt="" className="size-full rounded-full object-cover" /> : <span className="text-sm font-semibold">{nome?.[0]?.toUpperCase() ?? 'V'}</span>}<span className={`absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full ${minha ? 'bg-white text-brand' : 'bg-brand text-white'}`}><Mic size={12} /></span></div>}
    <button type="button" onClick={(e) => { e.stopPropagation(); void alternar() }} aria-label={tocando ? 'Pausar áudio' : 'Reproduzir áudio'} className={`flex size-11 shrink-0 items-center justify-center rounded-full ${minha ? 'text-white' : 'text-brand'}`}>{tocando ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}</button>
    <div className="min-w-0 flex-1">
      <div className="relative flex h-10 cursor-pointer items-center gap-[2px]" aria-label={tocando ? 'Pausar mensagem de voz' : 'Ouvir mensagem de voz'}>{ONDAS_AUDIO.map((altura, indice) => <span key={indice} className={`w-[2px] shrink-0 rounded-full ${indice / ONDAS_AUDIO.length * 100 <= percentual ? (minha ? 'bg-white' : 'bg-brand') : (minha ? 'bg-white/40' : 'bg-ink-3')}`} style={{ height: `${altura}px` }} />)}<input aria-label="Posição do áudio" type="range" min={0} max={duracao || 0} step={0.1} value={Math.min(posicao, duracao || 0)} onClick={(e) => e.stopPropagation()} onChange={(e) => { const audio = audioRef.current; if (audio) audio.currentTime = Number(e.target.value) }} className="absolute inset-0 size-full cursor-pointer opacity-0" /></div>
      <p className={`-mt-1 text-[10px] ${minha ? 'text-white/70' : 'text-ink-2'}`}>{falhou ? 'Áudio indisponível' : carregando ? 'Carregando áudio...' : formatarDuracao(duracao || posicao)}</p>
    </div>
  </div>
}

export function Chat({ conversaId, grupoId, mostrarAutores = false }: ChatProps) {
  const { sessao } = useSessao()
  const navigate = useNavigate()
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [escolhendo, setEscolhendo] = useState(false)
  const [marcando, setMarcando] = useState(false)
  const [localTreino, setLocalTreino] = useState('')
  const [dataTreino, setDataTreino] = useState('')
  const [horaTreino, setHoraTreino] = useState('')
  const [anexando, setAnexando] = useState(false)
  const [gravando, setGravando] = useState(false)
  const [segundosAudio, setSegundosAudio] = useState(0)
  const [audioPendente, setAudioPendente] = useState<File | null>(null)
  const [audioPendenteUrl, setAudioPendenteUrl] = useState<string | null>(null)
  const fimRef = useRef<HTMLDivElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galeriaRef = useRef<HTMLInputElement>(null)
  const gravadorRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const esperaAudioRef = useRef<number | null>(null)
  const segurandoAudioRef = useRef(false)
  const toqueLongoRef = useRef(false)
  const historico = useHistoricoTreinos(sessao?.user.id, 10)
  const destino = { conversaId, grupoId }

  async function carregar() {
    try {
      setErro(null)
      setMensagens(await listarMensagens(destino))
      await marcarMensagensComoLidas(destino)
    } catch { setErro('Não foi possível carregar as mensagens.') }
  }

  useEffect(() => {
    let cancelado = false
    const atualizar = async () => {
      try {
        const dados = await listarMensagens({ conversaId, grupoId })
        if (!cancelado) {
          setMensagens(dados)
          await marcarMensagensComoLidas({ conversaId, grupoId })
        }
      } catch { if (!cancelado) setErro('Não foi possível carregar as mensagens.') }
    }
    void atualizar()
    const intervalo = window.setInterval(() => void atualizar(), 8000)
    return () => { cancelado = true; window.clearInterval(intervalo) }
  }, [conversaId, grupoId])

  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensagens.length])

  useEffect(() => {
    if (!gravando) return
    const intervalo = window.setInterval(() => setSegundosAudio((atual) => {
      if (atual >= 299) { gravadorRef.current?.stop(); return 300 }
      return atual + 1
    }), 1000)
    return () => window.clearInterval(intervalo)
  }, [gravando])

  useEffect(() => () => {
    if (esperaAudioRef.current !== null) window.clearTimeout(esperaAudioRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  useEffect(() => () => { if (audioPendenteUrl) URL.revokeObjectURL(audioPendenteUrl) }, [audioPendenteUrl])

  async function enviar(treinoId?: string) {
    if (!texto.trim() && !treinoId) return
    setEnviando(true)
    try {
      await enviarMensagem(destino, texto, treinoId)
      setTexto(''); setEscolhendo(false)
      await carregar()
    } catch (e) {
      const detalhe = e instanceof Error ? e.message : ''
      setErro(detalhe.includes('sessão') || detalhe.includes('Sessão') ? detalhe : detalhe.includes('enviar_mensagem') || detalhe.includes('schema cache') ? 'As mensagens ainda não foram ativadas no banco. Execute o arquivo 22_mensagens.sql no Supabase.' : 'Não foi possível enviar a mensagem.')
    } finally { setEnviando(false) }
  }

  async function excluir(mensagem: Mensagem) {
    if (!window.confirm('Excluir esta mensagem?')) return
    try { await excluirMensagem(mensagem.id, mensagem.midiaPath); setMensagens((atuais) => atuais.filter((item) => item.id !== mensagem.id)); setErro(null) }
    catch { setErro('Não foi possível excluir a mensagem.') }
  }

  async function responderConvite(mensagem: Mensagem, aceitar: boolean) {
    if (!mensagem.conviteId || !mensagem.conviteGrupoId) return
    try {
      if (aceitar) {
        await aceitarConviteGrupo(mensagem.conviteGrupoId)
        navigate(`/social/grupo/${mensagem.conviteGrupoId}`)
      } else {
        await recusarConviteGrupo(mensagem.conviteId)
        await carregar()
      }
    } catch { setErro('Não foi possível responder ao convite.') }
  }

  async function confirmarTreino() {
    const dataHora = dataTreino && horaTreino ? `${dataTreino}T${horaTreino}` : ''
    const validacao = validarTreinoMarcado({ local: localTreino, dataHora })
    if (validacao) { setErro(validacao); return }
    setEnviando(true)
    try {
      await marcarTreino(destino, localTreino, dataHora)
      setMarcando(false); setLocalTreino(''); setDataTreino(''); setHoraTreino(''); setErro(null)
      await carregar()
    } catch { setErro('Não foi possível marcar o treino. Verifique se a atualização 23 foi aplicada no banco.') }
    finally { setEnviando(false) }
  }

  async function confirmarParticipacao(mensagem: Mensagem) {
    if (!mensagem.treinoMarcadoId || mensagem.participandoTreino) return
    try { await participarTreino(mensagem.treinoMarcadoId); await carregar() }
    catch { setErro('Não foi possível confirmar sua participação.') }
  }

  async function enviarArquivo(arquivo?: File | null) {
    if (!arquivo) return
    setEnviando(true); setAnexando(false); setErro(null)
    try { await enviarMidia(destino, arquivo); await carregar() }
    catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível enviar o arquivo.') }
    finally { setEnviando(false) }
  }

  async function tirarFoto() {
    try {
      const arquivo = await capturarFotoNativa()
      if (arquivo === undefined) cameraRef.current?.click()
      else await enviarArquivo(arquivo)
    } catch { setErro('Não foi possível abrir a câmera.') }
  }

  async function iniciarAudio() {
    descartarAudio(); setErro(null); setAnexando(false)
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('Gravação de áudio não disponível neste aparelho.')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // MP4/AAC é a opção mais confiável para reprodução no WebView Android.
      const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find((tipo) => MediaRecorder.isTypeSupported(tipo))
      const gravador = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      const partes: Blob[] = []
      gravador.ondataavailable = (evento) => { if (evento.data.size) partes.push(evento.data) }
      gravador.onstop = () => {
        const tipo = gravador.mimeType.split(';')[0] || 'audio/webm'
        const extensao = tipo === 'audio/mp4' ? 'm4a' : 'webm'
        stream.getTracks().forEach((track) => track.stop()); streamRef.current = null; setGravando(false)
        if (partes.length) {
          const arquivo = new File(partes, `audio-${Date.now()}.${extensao}`, { type: tipo })
          setAudioPendente(arquivo)
          setAudioPendenteUrl(URL.createObjectURL(arquivo))
        }
      }
      streamRef.current = stream; gravadorRef.current = gravador; setSegundosAudio(0); setGravando(true); gravador.start()
      if (!segurandoAudioRef.current) gravador.stop()
    } catch (e) { setErro(e instanceof Error ? e.message : 'Permita o acesso ao microfone para gravar.') }
  }

  function pararAudio() { if (gravadorRef.current?.state === 'recording') gravadorRef.current.stop() }

  function descartarAudio() {
    if (gravadorRef.current?.state === 'recording') gravadorRef.current.stop()
    if (audioPendenteUrl) URL.revokeObjectURL(audioPendenteUrl)
    setAudioPendente(null); setAudioPendenteUrl(null); setSegundosAudio(0)
  }

  async function enviarAudioPendente() {
    if (!audioPendente) return
    const arquivo = audioPendente
    setAudioPendente(null)
    if (audioPendenteUrl) URL.revokeObjectURL(audioPendenteUrl)
    setAudioPendenteUrl(null)
    await enviarArquivo(arquivo)
  }

  function iniciarPressaoAudio(evento: React.PointerEvent<HTMLButtonElement>) {
    if (texto.trim() || enviando || gravando) return
    evento.currentTarget.setPointerCapture(evento.pointerId)
    segurandoAudioRef.current = true
    toqueLongoRef.current = false
    esperaAudioRef.current = window.setTimeout(() => {
      toqueLongoRef.current = true
      esperaAudioRef.current = null
      void iniciarAudio()
    }, 350)
  }

  function terminarPressaoAudio() {
    segurandoAudioRef.current = false
    if (esperaAudioRef.current !== null) {
      window.clearTimeout(esperaAudioRef.current)
      esperaAudioRef.current = null
    }
    if (toqueLongoRef.current) pararAudio()
  }

  function acionarEnvio() {
    if (toqueLongoRef.current) {
      toqueLongoRef.current = false
      return
    }
    if (texto.trim()) void enviar()
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto border-b border-line/60 py-4">
        {mensagens.length === 0 && !erro && <p className="py-12 text-center text-sm text-ink-2">Comece a conversa.</p>}
        {mensagens.map((mensagem) => {
          const minha = mensagem.remetenteId === sessao?.user.id
          return <div key={mensagem.id} className={`flex items-end gap-1 ${minha ? 'justify-end' : 'justify-start'}`}>
            {minha && <button onClick={() => void excluir(mensagem)} aria-label="Excluir mensagem" className="flex size-10 shrink-0 items-center justify-center text-white/40 hover:text-down"><Trash2 size={15} /></button>}
            {mostrarAutores && !minha && <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-card">{mensagem.fotoUrl ? <img src={mensagem.fotoUrl} alt="" className="size-full object-cover" /> : mensagem.nome[0]}</div>}
            <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 ${minha ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md bg-card text-ink'}`}>
              {mostrarAutores && !minha && <p className="mb-1 text-xs font-semibold text-brand">{mensagem.nome}</p>}
              {mensagem.texto && !mensagem.treinoMarcadoId && !mensagem.conviteId && <p className="whitespace-pre-wrap break-words text-sm leading-5">{mensagem.texto}</p>}
              {mensagem.conviteGrupoId && <div className="mt-1"><div className="flex items-center gap-3"><div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-app/40">{mensagem.conviteGrupoFoto ? <img src={mensagem.conviteGrupoFoto} alt="" className="size-full object-cover" /> : <Users size={19} />}</div><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] opacity-60">Convite para guilda</p><p className="truncate text-sm font-semibold">{mensagem.conviteGrupoNome}</p><p className="mt-0.5 text-[11px] opacity-70">{minha ? 'Você enviou este convite.' : `${mensagem.nome} convidou você.`}</p></div></div>{!minha && mensagem.conviteAtivo && <div className="mt-3 grid grid-cols-[0.8fr_1.2fr] gap-2"><button onClick={() => void responderConvite(mensagem, false)} className="flex min-h-11 items-center justify-center gap-1 rounded-xl border border-line bg-app/30 text-xs font-semibold"><X size={15} /> Recusar</button><button onClick={() => void responderConvite(mensagem, true)} className="flex min-h-11 items-center justify-center gap-1 rounded-xl bg-white text-xs font-semibold text-app"><Check size={15} /> Entrar no grupo</button></div>}{!mensagem.conviteAtivo && <p className="mt-3 border-t border-white/15 pt-2 text-xs opacity-60">Convite encerrado</p>}</div>}
              {mensagem.treinoId && <div className="mt-2 flex items-center gap-2 border-t border-white/20 pt-2 text-xs font-semibold"><Dumbbell size={15} /> Treino marcado</div>}
              {mensagem.treinoMarcadoId && mensagem.treinoMarcadoEm && <div className="mt-2 border-t border-white/20 pt-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] opacity-60">Treino marcado</p>
                <div className="space-y-1.5 text-xs"><p className="flex items-center gap-2"><CalendarDays size={15} /> {formatarDataHoraTreino(mensagem.treinoMarcadoEm)}</p><p className="flex items-center gap-2"><MapPin size={15} /> {mensagem.treinoMarcadoLocal}</p><p className="flex items-center gap-2"><Users size={15} /> {mensagem.treinoMarcadoParticipantes} {mensagem.treinoMarcadoParticipantes === 1 ? 'participante' : 'participantes'}</p></div>
                <button disabled={mensagem.participandoTreino} onClick={() => void confirmarParticipacao(mensagem)} className={`mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold ${mensagem.participandoTreino ? 'border border-white/20 bg-transparent opacity-70' : 'bg-white text-app'}`}>{mensagem.participandoTreino ? <><Check size={15} /> Participação confirmada</> : <><Dumbbell size={15} /> Participar do treino</>}</button>
              </div>}
              {mensagem.midiaTipo === 'imagem' && mensagem.midiaUrl && <button onClick={() => window.open(mensagem.midiaUrl!, '_blank', 'noopener,noreferrer')} className="mt-1 block overflow-hidden rounded-xl" aria-label="Abrir foto"><img src={mensagem.midiaUrl} alt="Foto enviada na conversa" loading="lazy" className="max-h-80 w-full object-cover" /></button>}
              {mensagem.midiaTipo === 'audio' && <PlayerAudio url={mensagem.midiaUrl} midiaPath={mensagem.midiaPath} minha={minha} fotoUrl={mensagem.fotoUrl} nome={mensagem.nome} />}
              <p className={`mt-1 text-right text-[10px] ${minha ? 'text-white/60' : 'text-ink-3'}`}>{new Date(mensagem.criadaEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        })}
        <div ref={fimRef} />
      </div>
      {erro && <p className="mt-2 text-sm text-down">{erro}</p>}
      {escolhendo && <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-line bg-card p-2"><button onClick={() => { setEscolhendo(false); setMarcando(true); setErro(null) }} className="flex min-h-12 w-full items-center gap-3 border-b border-line px-2 text-left text-sm font-semibold text-brand"><CalendarDays size={18} /> Marcar novo treino</button><p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-2">Compartilhar treino concluído</p>{historico.carregando ? <p className="p-3 text-xs text-ink-2">Carregando treinos...</p> : historico.treinos.map((treino) => <button key={treino.id} onClick={() => void enviar(treino.id)} className="min-h-12 w-full border-b border-line/60 px-2 text-left text-sm">{treino.nome}</button>)}</div>}
      {anexando && <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-line bg-card p-2"><button onClick={() => void tirarFoto()} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-line text-xs"><Camera size={19} className="text-brand" /> Câmera</button><button onClick={() => galeriaRef.current?.click()} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-line text-xs"><Image size={19} className="text-brand" /> Galeria</button></div>}
      {audioPendente && audioPendenteUrl && <div className="mt-2 flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-card px-3 py-2">
        <button type="button" onClick={descartarAudio} aria-label="Excluir gravação" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-down/15 text-down"><Trash2 size={18} /></button>
        <div className="min-w-0 flex-1"><PlayerAudio url={audioPendenteUrl} minha={false} modoPrevia /><p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-ink-2">Revise antes de enviar</p></div>
        <button type="button" disabled={enviando} onClick={() => void enviarAudioPendente()} aria-label="Enviar áudio" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:opacity-50"><Send size={19} /></button>
      </div>}
      <div className="mt-auto flex shrink-0 items-end gap-2 bg-app py-2">
        <button onClick={() => setEscolhendo((valor) => !valor)} aria-label="Marcar treino" className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-card text-brand"><Dumbbell size={18} /></button>
        {gravando ? <div className="flex min-h-12 flex-1 items-center justify-between gap-2 rounded-3xl border border-down/50 bg-down/10 px-4 text-sm text-down"><span className="size-2 animate-pulse rounded-full bg-down" /><span className="font-semibold">Gravando · {formatarDuracao(segundosAudio)}</span><button type="button" onClick={pararAudio} className="flex min-h-11 items-center gap-2 px-2"><Square size={15} fill="currentColor" /> Parar</button></div> : <textarea disabled={!!audioPendente} value={texto} maxLength={1000} onChange={(e) => setTexto(e.target.value)} rows={1} placeholder={audioPendente ? 'Envie ou exclua a gravação' : 'Mensagem'} className="min-h-12 min-w-0 flex-1 resize-none rounded-3xl border border-line bg-card px-4 py-3 text-sm outline-none focus:border-brand disabled:opacity-50" />}
        {!gravando && !audioPendente && <button onClick={() => { setAnexando((valor) => !valor); setEscolhendo(false) }} aria-label="Enviar foto" className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-card text-brand"><Paperclip size={18} /></button>}
        {!gravando && !audioPendente && <button disabled={enviando} onPointerDown={iniciarPressaoAudio} onPointerUp={terminarPressaoAudio} onPointerCancel={terminarPressaoAudio} onClick={acionarEnvio} onContextMenu={(evento) => evento.preventDefault()} aria-label={texto.trim() ? 'Enviar mensagem' : 'Mantenha pressionado para gravar áudio'} className="flex size-12 shrink-0 touch-none items-center justify-center rounded-full bg-brand text-white disabled:opacity-50">{texto.trim() ? <Send size={18} /> : <Mic size={19} />}</button>}
      </div>
      <input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(e) => { void enviarArquivo(e.target.files?.[0]); e.target.value = '' }} />
      <input ref={galeriaRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { void enviarArquivo(e.target.files?.[0]); e.target.value = '' }} />
      {marcando && <Modal rotulo="Marcar treino" fechar={() => setMarcando(false)}><div className="w-full max-w-md rounded-2xl border border-line bg-card p-5"><div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand">Treino em conjunto</p><h2 className="mt-1 text-xl font-semibold">Marcar treino</h2><p className="mt-1 text-sm text-ink-2">Escolha onde e quando vocês vão treinar.</p></div><button onClick={() => setMarcando(false)} aria-label="Fechar" className="flex size-11 items-center justify-center rounded-full border border-line"><X size={18} /></button></div><label className="block text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Local<div className="mt-2 flex items-center rounded-xl border border-line bg-app px-3 focus-within:border-brand"><MapPin size={18} className="text-ink-2" /><input autoFocus value={localTreino} onChange={(e) => setLocalTreino(e.target.value)} maxLength={120} placeholder="Ex.: Academia Central" className="min-h-12 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" /></div></label><div className="mt-4 grid grid-cols-2 gap-3"><label className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Data<div className="mt-2 flex items-center rounded-xl border border-line bg-app px-3 focus-within:border-brand"><CalendarDays size={17} /><input type="date" value={dataTreino} onChange={(e) => setDataTreino(e.target.value)} className="min-h-12 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none [color-scheme:dark]" /></div></label><label className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Horário<div className="mt-2 flex items-center rounded-xl border border-line bg-app px-3 focus-within:border-brand"><Clock3 size={17} /><input type="time" value={horaTreino} onChange={(e) => setHoraTreino(e.target.value)} className="min-h-12 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none [color-scheme:dark]" /></div></label></div>{erro && <p className="mt-3 text-sm text-down">{erro}</p>}<button disabled={enviando} onClick={() => void confirmarTreino()} className="mt-5 min-h-12 w-full rounded-xl bg-brand font-semibold text-white disabled:opacity-50">{enviando ? 'Marcando...' : 'Marcar treino'}</button></div></Modal>}
    </section>
  )
}
