import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Camera, Check, Clock3, Dumbbell, Image, MapPin, Mic, Paperclip, Send, Square, Trash2, Users, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSessao } from '../lib/auth'
import { useHistoricoTreinos } from '../lib/historicoTreinos'
import { Modal } from './Modal'
import { aceitarConviteGrupo, enviarMensagem, enviarMidia, excluirMensagem, listarMensagens, marcarMensagensComoLidas, marcarTreino, participarTreino, recusarConviteGrupo, type Mensagem } from '../lib/social/mensagens'
import { formatarDataHoraTreino, validarTreinoMarcado } from '../lib/social/treinoMarcado'
import { capturarFotoNativa } from '../lib/cameraNativa'

type ChatProps = { conversaId?: string; grupoId?: string; mostrarAutores?: boolean }

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

  async function enviar(treinoId?: string) {
    if (!texto.trim() && !treinoId) return
    setEnviando(true)
    try {
      await enviarMensagem(destino, texto, treinoId)
      setTexto(''); setEscolhendo(false)
      await carregar()
    } catch (e) {
      const detalhe = e instanceof Error ? e.message : ''
      setErro(detalhe.includes('enviar_mensagem') || detalhe.includes('schema cache') ? 'As mensagens ainda não foram ativadas no banco. Execute o arquivo 22_mensagens.sql no Supabase.' : 'Não foi possível enviar a mensagem.')
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
    setErro(null); setAnexando(false)
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('Gravação de áudio não disponível neste aparelho.')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((tipo) => MediaRecorder.isTypeSupported(tipo))
      const gravador = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      const partes: Blob[] = []
      gravador.ondataavailable = (evento) => { if (evento.data.size) partes.push(evento.data) }
      gravador.onstop = () => {
        const tipo = gravador.mimeType.split(';')[0] || 'audio/webm'
        const extensao = tipo === 'audio/mp4' ? 'm4a' : 'webm'
        stream.getTracks().forEach((track) => track.stop()); streamRef.current = null; setGravando(false)
        if (partes.length) void enviarArquivo(new File(partes, `audio-${Date.now()}.${extensao}`, { type: tipo }))
      }
      streamRef.current = stream; gravadorRef.current = gravador; setSegundosAudio(0); setGravando(true); gravador.start()
      if (!segurandoAudioRef.current) gravador.stop()
    } catch (e) { setErro(e instanceof Error ? e.message : 'Permita o acesso ao microfone para gravar.') }
  }

  function pararAudio() { if (gravadorRef.current?.state === 'recording') gravadorRef.current.stop() }

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
              {mensagem.texto && !mensagem.treinoMarcadoId && <p className="whitespace-pre-wrap break-words text-sm leading-5">{mensagem.texto}</p>}
              {mensagem.conviteGrupoId && <div className="mt-2 border-t border-white/20 pt-3"><div className="flex items-center gap-2"><div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-app/40">{mensagem.conviteGrupoFoto ? <img src={mensagem.conviteGrupoFoto} alt="" className="size-full object-cover" /> : <Users size={18} />}</div><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] opacity-60">Convite para guilda</p><p className="truncate text-sm font-semibold">{mensagem.conviteGrupoNome}</p></div></div>{!minha && mensagem.conviteAtivo && <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => void responderConvite(mensagem, false)} className="flex min-h-11 items-center justify-center gap-1 rounded-xl border border-line bg-app/30 text-xs font-semibold"><X size={15} /> Recusar</button><button onClick={() => void responderConvite(mensagem, true)} className="flex min-h-11 items-center justify-center gap-1 rounded-xl bg-white text-xs font-semibold text-app"><Check size={15} /> Aceitar</button></div>}{!mensagem.conviteAtivo && <p className="mt-2 text-xs opacity-60">Convite encerrado</p>}</div>}
              {mensagem.treinoId && <div className="mt-2 flex items-center gap-2 border-t border-white/20 pt-2 text-xs font-semibold"><Dumbbell size={15} /> Treino marcado</div>}
              {mensagem.treinoMarcadoId && mensagem.treinoMarcadoEm && <div className="mt-2 border-t border-white/20 pt-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] opacity-60">Treino marcado</p>
                <div className="space-y-1.5 text-xs"><p className="flex items-center gap-2"><CalendarDays size={15} /> {formatarDataHoraTreino(mensagem.treinoMarcadoEm)}</p><p className="flex items-center gap-2"><MapPin size={15} /> {mensagem.treinoMarcadoLocal}</p><p className="flex items-center gap-2"><Users size={15} /> {mensagem.treinoMarcadoParticipantes} {mensagem.treinoMarcadoParticipantes === 1 ? 'participante' : 'participantes'}</p></div>
                <button disabled={mensagem.participandoTreino} onClick={() => void confirmarParticipacao(mensagem)} className={`mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold ${mensagem.participandoTreino ? 'border border-white/20 bg-transparent opacity-70' : 'bg-white text-app'}`}>{mensagem.participandoTreino ? <><Check size={15} /> Participação confirmada</> : <><Dumbbell size={15} /> Participar do treino</>}</button>
              </div>}
              {mensagem.midiaTipo === 'imagem' && mensagem.midiaUrl && <button onClick={() => window.open(mensagem.midiaUrl!, '_blank', 'noopener,noreferrer')} className="mt-1 block overflow-hidden rounded-xl" aria-label="Abrir foto"><img src={mensagem.midiaUrl} alt="Foto enviada na conversa" loading="lazy" className="max-h-80 w-full object-cover" /></button>}
              {mensagem.midiaTipo === 'audio' && mensagem.midiaUrl && <audio controls preload="metadata" src={mensagem.midiaUrl} className="mt-1 h-11 w-[240px] max-w-full" />}
              <p className={`mt-1 text-right text-[10px] ${minha ? 'text-white/60' : 'text-ink-3'}`}>{new Date(mensagem.criadaEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        })}
        <div ref={fimRef} />
      </div>
      {erro && <p className="mt-2 text-sm text-down">{erro}</p>}
      {escolhendo && <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-line bg-card p-2"><button onClick={() => { setEscolhendo(false); setMarcando(true); setErro(null) }} className="flex min-h-12 w-full items-center gap-3 border-b border-line px-2 text-left text-sm font-semibold text-brand"><CalendarDays size={18} /> Marcar novo treino</button><p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-2">Compartilhar treino concluído</p>{historico.carregando ? <p className="p-3 text-xs text-ink-2">Carregando treinos...</p> : historico.treinos.map((treino) => <button key={treino.id} onClick={() => void enviar(treino.id)} className="min-h-12 w-full border-b border-line/60 px-2 text-left text-sm">{treino.nome}</button>)}</div>}
      {anexando && <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-line bg-card p-2"><button onClick={() => void tirarFoto()} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-line text-xs"><Camera size={19} className="text-brand" /> Câmera</button><button onClick={() => galeriaRef.current?.click()} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-line text-xs"><Image size={19} className="text-brand" /> Galeria</button></div>}
      <div className="mt-auto flex shrink-0 items-end gap-2 bg-app py-2">
        <button onClick={() => setEscolhendo((valor) => !valor)} aria-label="Marcar treino" className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-card text-brand"><Dumbbell size={18} /></button>
        {gravando ? <button onClick={pararAudio} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-3xl border border-down/50 bg-down/10 text-sm text-down"><Square size={15} fill="currentColor" /> Parar · {Math.floor(segundosAudio / 60)}:{String(segundosAudio % 60).padStart(2, '0')}</button> : <textarea value={texto} maxLength={1000} onChange={(e) => setTexto(e.target.value)} rows={1} placeholder="Mensagem" className="min-h-12 min-w-0 flex-1 resize-none rounded-3xl border border-line bg-card px-4 py-3 text-sm outline-none focus:border-brand" />}
        {!gravando && <button onClick={() => { setAnexando((valor) => !valor); setEscolhendo(false) }} aria-label="Enviar foto" className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-card text-brand"><Paperclip size={18} /></button>}
        {!gravando && <button disabled={enviando} onPointerDown={iniciarPressaoAudio} onPointerUp={terminarPressaoAudio} onPointerCancel={terminarPressaoAudio} onClick={acionarEnvio} onContextMenu={(evento) => evento.preventDefault()} aria-label={texto.trim() ? 'Enviar mensagem' : 'Mantenha pressionado para gravar áudio'} className="flex size-12 shrink-0 touch-none items-center justify-center rounded-full bg-brand text-white disabled:opacity-50">{texto.trim() ? <Send size={18} /> : <Mic size={19} />}</button>}
      </div>
      <input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(e) => { void enviarArquivo(e.target.files?.[0]); e.target.value = '' }} />
      <input ref={galeriaRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { void enviarArquivo(e.target.files?.[0]); e.target.value = '' }} />
      {marcando && <Modal rotulo="Marcar treino" fechar={() => setMarcando(false)}><div className="w-full max-w-md rounded-2xl border border-line bg-card p-5"><div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand">Treino em conjunto</p><h2 className="mt-1 text-xl font-semibold">Marcar treino</h2><p className="mt-1 text-sm text-ink-2">Escolha onde e quando vocês vão treinar.</p></div><button onClick={() => setMarcando(false)} aria-label="Fechar" className="flex size-11 items-center justify-center rounded-full border border-line"><X size={18} /></button></div><label className="block text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Local<div className="mt-2 flex items-center rounded-xl border border-line bg-app px-3 focus-within:border-brand"><MapPin size={18} className="text-ink-2" /><input autoFocus value={localTreino} onChange={(e) => setLocalTreino(e.target.value)} maxLength={120} placeholder="Ex.: Academia Central" className="min-h-12 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" /></div></label><div className="mt-4 grid grid-cols-2 gap-3"><label className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Data<div className="mt-2 flex items-center rounded-xl border border-line bg-app px-3 focus-within:border-brand"><CalendarDays size={17} /><input type="date" value={dataTreino} onChange={(e) => setDataTreino(e.target.value)} className="min-h-12 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none [color-scheme:dark]" /></div></label><label className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Horário<div className="mt-2 flex items-center rounded-xl border border-line bg-app px-3 focus-within:border-brand"><Clock3 size={17} /><input type="time" value={horaTreino} onChange={(e) => setHoraTreino(e.target.value)} className="min-h-12 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none [color-scheme:dark]" /></div></label></div>{erro && <p className="mt-3 text-sm text-down">{erro}</p>}<button disabled={enviando} onClick={() => void confirmarTreino()} className="mt-5 min-h-12 w-full rounded-xl bg-brand font-semibold text-white disabled:opacity-50">{enviando ? 'Marcando...' : 'Marcar treino'}</button></div></Modal>}
    </section>
  )
}
