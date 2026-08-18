import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  User,
  Dumbbell,
  Apple,
  Palette,
  ShieldCheck,
  Database,
  Smartphone,
  Info,
} from 'lucide-react'
import { Page } from '../components/Page'
import { Empty } from '../components/Empty'
import { useSessao } from '../lib/auth'
import { usePerfil, atualizarPerfil, ROTULO_OBJETIVO, ROTULO_NIVEL, type Objetivo, type Nivel } from '../lib/perfil'
import { usePreferencias, salvarPreferencias, type Preferencias } from '../lib/preferencias'
import { supabase } from '../lib/supabase'
import type { Equipamento } from '../data/exercicios'
import { montarPacoteExportacao } from '../lib/exportacao'

const EQUIPAMENTOS: Equipamento[] = ['Barra', 'Halter', 'Cabo', 'Máquina', 'Peso corporal', 'Elástico']
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const OBJETIVOS = Object.keys(ROTULO_OBJETIVO) as Objetivo[]
const NIVEIS = Object.keys(ROTULO_NIVEL) as Nivel[]

type Secao =
  | 'menu'
  | 'perfil'
  | 'treinamento'
  | 'nutricao'
  | 'aparencia'
  | 'privacidade'
  | 'dados'
  | 'aplicativo'
  | 'sobre'

function Interruptor({ ativo, onChange }: { ativo: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ativo}
      onClick={() => onChange(!ativo)}
      className={`h-7 w-12 shrink-0 rounded-full border transition-colors ${
        ativo ? 'border-brand bg-brand/30' : 'border-line bg-card-hover'
      }`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-white transition-transform ${ativo ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  )
}

function LinhaSwitch({ label, ativo, onChange }: { label: string; ativo: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-ink">{label}</span>
      <Interruptor ativo={ativo} onChange={onChange} />
    </div>
  )
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors ${
        ativo ? 'bg-brand/15 text-brand' : 'border border-line text-ink-2'
      }`}
    >
      {children}
    </button>
  )
}

const CATEGORIAS: { secao: Secao; icone: typeof User; titulo: string; descricao: string }[] = [
  { secao: 'perfil', icone: User, titulo: 'Perfil', descricao: 'Objetivo, nível e disponibilidade' },
  { secao: 'treinamento', icone: Dumbbell, titulo: 'Treinamento', descricao: 'Duração, horário e equipamentos preferidos' },
  { secao: 'nutricao', icone: Apple, titulo: 'Nutrição', descricao: 'O que aparece no seu diário alimentar' },
  { secao: 'aparencia', icone: Palette, titulo: 'Aparência', descricao: 'Animações e movimento' },
  { secao: 'privacidade', icone: ShieldCheck, titulo: 'Privacidade e segurança', descricao: 'Gerencie seus dados e sua conta' },
  { secao: 'dados', icone: Database, titulo: 'Meus dados', descricao: 'Exporte tudo que o VIVECI guarda de você' },
  { secao: 'aplicativo', icone: Smartphone, titulo: 'Aplicativo', descricao: 'Versão e cache' },
  { secao: 'sobre', icone: Info, titulo: 'Sobre', descricao: 'Sobre o VIVECI' },
]

function Cabecalho({ titulo, onVoltar }: { titulo: string; onVoltar: () => void }) {
  return (
    <div className="mt-6 flex items-center gap-3 border-b border-line/70 pb-5">
      <button onClick={onVoltar} aria-label="Voltar" className="flex h-11 w-11 items-center justify-center text-ink-2 hover:text-ink">
        <ChevronLeft size={22} strokeWidth={1.75} />
      </button>
      <h2 className="text-[19px] font-bold">{titulo}</h2>
    </div>
  )
}

function SecaoPerfil({ userId, onVoltar }: { userId: string; onVoltar: () => void }) {
  const { perfil, recarregar } = usePerfil(userId)
  const [salvando, setSalvando] = useState(false)

  if (!perfil) return <Empty text="Carregando..." />

  async function definir(dados: Partial<{ objetivo: Objetivo; nivel: Nivel; dias_semana: number }>) {
    setSalvando(true)
    try {
      await atualizarPerfil(userId, dados)
      recarregar()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="pb-4">
      <Cabecalho titulo="Meu perfil" onVoltar={onVoltar} />
      <div className="mt-5 space-y-5">
        <div className="rounded-2xl border border-line bg-card p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Objetivo principal</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {OBJETIVOS.map((o) => (
              <Chip key={o} ativo={perfil.objetivo === o} onClick={() => definir({ objetivo: o })}>
                {ROTULO_OBJETIVO[o]}
              </Chip>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Nível de treinamento</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {NIVEIS.map((n) => (
              <Chip key={n} ativo={perfil.nivel === n} onClick={() => definir({ nivel: n })}>
                {ROTULO_NIVEL[n]}
              </Chip>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Disponibilidade (dias/semana)</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <Chip key={d} ativo={perfil.dias_semana === d} onClick={() => definir({ dias_semana: d })}>
                {String(d)}
              </Chip>
            ))}
          </div>
        </div>
        {salvando && <p className="text-xs text-ink-2">Salvando...</p>}
      </div>
    </div>
  )
}

function usarCampoPreferencia(userId: string, preferencias: Preferencias, recarregar: () => void) {
  return async function definir(dados: Partial<Preferencias>) {
    try {
      await salvarPreferencias(userId, { ...preferencias, ...dados })
      recarregar()
    } catch {
      /* tabela de preferências ainda não criada no banco — falha silenciosa até rodar sql/07 */
    }
  }
}

function SecaoTreinamento({ userId, onVoltar }: { userId: string; onVoltar: () => void }) {
  const { preferencias, carregando, recarregar } = usePreferencias(userId)
  const definir = usarCampoPreferencia(userId, preferencias, recarregar)

  function alternarDia(dia: number) {
    const atual = preferencias.dias_treino_preferidos
    const novo = atual.includes(dia) ? atual.filter((d) => d !== dia) : [...atual, dia].sort()
    definir({ dias_treino_preferidos: novo })
  }

  function alternarEquipamento(eq: Equipamento) {
    const atual = preferencias.equipamentos_disponiveis
    const novo = atual.includes(eq) ? atual.filter((e) => e !== eq) : [...atual, eq]
    definir({ equipamentos_disponiveis: novo })
  }

  if (carregando) return <Empty text="Carregando..." />

  return (
    <div className="pb-4">
      <Cabecalho titulo="Preferências de treino" onVoltar={onVoltar} />
      <div className="mt-5 space-y-5">
        <div className="rounded-2xl border border-line bg-card p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Duração preferida</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {[15, 20, 30, 45, 60, 90].map((min) => (
              <Chip
                key={min}
                ativo={preferencias.duracao_treino_preferida_min === min}
                onClick={() => definir({ duracao_treino_preferida_min: min })}
              >
                {`${min} min`}
              </Chip>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Horário preferido</h3>
          <input
            type="time"
            value={preferencias.horario_treino_preferido ?? ''}
            onChange={(e) => definir({ horario_treino_preferido: e.target.value || null })}
            className="mt-3 h-11 w-full rounded-xl border border-line bg-card-hover px-3 text-sm text-ink focus:border-brand focus:outline-none"
          />
        </div>

        <div className="rounded-2xl border border-line bg-card p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Dias preferidos</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {DIAS_SEMANA.map((label, i) => (
              <Chip key={label} ativo={preferencias.dias_treino_preferidos.includes(i)} onClick={() => alternarDia(i)}>
                {label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Equipamentos disponíveis</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {EQUIPAMENTOS.map((eq) => (
              <Chip key={eq} ativo={preferencias.equipamentos_disponiveis.includes(eq)} onClick={() => alternarEquipamento(eq)}>
                {eq}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SecaoNutricao({ userId, onVoltar }: { userId: string; onVoltar: () => void }) {
  const { preferencias, carregando, recarregar } = usePreferencias(userId)
  const definir = usarCampoPreferencia(userId, preferencias, recarregar)

  if (carregando) return <Empty text="Carregando..." />

  return (
    <div className="pb-4">
      <Cabecalho titulo="Preferências de nutrição" onVoltar={onVoltar} />
      <div className="mt-5 divide-y divide-line rounded-2xl border border-line bg-card px-6">
        <LinhaSwitch label="Mostrar calorias" ativo={preferencias.nutricao_mostrar_kcal} onChange={(v) => definir({ nutricao_mostrar_kcal: v })} />
        <LinhaSwitch label="Mostrar proteínas" ativo={preferencias.nutricao_mostrar_proteina} onChange={(v) => definir({ nutricao_mostrar_proteina: v })} />
        <LinhaSwitch label="Mostrar carboidratos" ativo={preferencias.nutricao_mostrar_carboidrato} onChange={(v) => definir({ nutricao_mostrar_carboidrato: v })} />
        <LinhaSwitch label="Mostrar gorduras" ativo={preferencias.nutricao_mostrar_gordura} onChange={(v) => definir({ nutricao_mostrar_gordura: v })} />
      </div>
    </div>
  )
}

function SecaoAparencia({ userId, onVoltar }: { userId: string; onVoltar: () => void }) {
  const { preferencias, carregando, recarregar } = usePreferencias(userId)
  const definir = usarCampoPreferencia(userId, preferencias, recarregar)

  if (carregando) return <Empty text="Carregando..." />

  return (
    <div className="pb-4">
      <Cabecalho titulo="Aparência" onVoltar={onVoltar} />
      <div className="mt-5 rounded-2xl border border-line bg-card p-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Tema</h3>
        <p className="mt-2 text-sm text-ink-2">
          O VIVECI hoje só existe no tema escuro — é o visual da marca. Temas claro e automático ainda não foram
          construídos.
        </p>
      </div>
      <div className="mt-5 divide-y divide-line rounded-2xl border border-line bg-card px-6">
        <LinhaSwitch label="Animações" ativo={preferencias.animacoes} onChange={(v) => definir({ animacoes: v })} />
        <LinhaSwitch label="Reduzir movimento" ativo={preferencias.reduzir_movimento} onChange={(v) => definir({ reduzir_movimento: v })} />
      </div>
    </div>
  )
}

function SecaoPrivacidade({ userId, onVoltar }: { userId: string; onVoltar: () => void }) {
  const [confirmando, setConfirmando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [confirmandoConta, setConfirmandoConta] = useState(false)
  const [confirmacaoConta, setConfirmacaoConta] = useState('')
  const exclusaoContaIniciada = useRef(false)

  async function excluirFotos() {
    setExcluindo(true)
    setMensagem(null)
    try {
      const { data: arquivos } = await supabase.storage.from('midia-publica').list(`${userId}/avatar`)
      if (arquivos && arquivos.length > 0) {
        await supabase.storage.from('midia-publica').remove(arquivos.map((a) => `${userId}/avatar/${a.name}`))
      }
      await atualizarPerfil(userId, { foto_url: null })
      setMensagem('Suas fotos foram removidas.')
    } catch (err) {
      setMensagem(err instanceof Error ? err.message : 'Não deu pra remover suas fotos agora.')
    } finally {
      setExcluindo(false)
      setConfirmando(false)
    }
  }

  async function excluirConta() {
    if (confirmacaoConta !== 'EXCLUIR' || exclusaoContaIniciada.current) return
    exclusaoContaIniciada.current = true
    setExcluindo(true)
    setMensagem(null)
    try {
      const { error } = await supabase.functions.invoke('excluir-conta')
      if (error) throw error
      sessionStorage.clear()
      localStorage.removeItem('viveci-onboarding-rascunho')
      await supabase.auth.signOut({ scope: 'local' })
      window.location.replace('/login')
    } catch {
      exclusaoContaIniciada.current = false
      setExcluindo(false)
      setMensagem('Não foi possível excluir sua conta por completo. Nenhum sucesso foi confirmado. Tente novamente ou contate o suporte.')
    }
  }

  return (
    <div className="pb-4">
      <Cabecalho titulo="Privacidade e segurança" onVoltar={onVoltar} />
      <div className="mt-5 rounded-2xl border border-line bg-card p-6">
        <h3 className="text-[17px] font-semibold">Dados que guardamos</h3>
        <p className="mt-2 text-sm text-ink-2">
          Rotinas, séries, cardio, medidas, nutrição, preferências e Body Scan são privados. Nome, bio, avatar e o
          conteúdo que você publica no Social podem ser vistos por outros usuários autenticados.
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-card p-6">
        <h3 className="text-[17px] font-semibold">Excluir minha foto de perfil</h3>
        <p className="mt-1 text-sm text-ink-2">Remove sua foto do armazenamento. Essa ação não pode ser desfeita.</p>
        {confirmando ? (
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => setConfirmando(false)}
              className="h-10 flex-1 rounded-xl border border-line text-sm font-semibold text-ink-2"
            >
              Cancelar
            </button>
            <button
              onClick={excluirFotos}
              disabled={excluindo}
              className="h-10 flex-1 rounded-xl bg-down text-sm font-semibold text-white disabled:opacity-60"
            >
              {excluindo ? 'Excluindo...' : 'Confirmar exclusão'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmando(true)}
            className="mt-3 h-10 w-full rounded-xl border border-line text-sm font-semibold text-down"
          >
            Excluir fotos
          </button>
        )}
        {mensagem && <p className="mt-3 text-xs text-ink-2">{mensagem}</p>}
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-card p-6">
        <h3 className="text-[17px] font-semibold">Excluir conta</h3>
        <p className="mt-1 text-sm text-ink-2">Remove sua conta, seus dados e seus arquivos. Esta ação não pode ser desfeita.</p>
        {confirmandoConta ? (
          <div className="mt-4">
            <label htmlFor="confirmar-exclusao-conta" className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">
              Digite EXCLUIR para confirmar
            </label>
            <input
              id="confirmar-exclusao-conta"
              value={confirmacaoConta}
              onChange={(evento) => setConfirmacaoConta(evento.target.value.toUpperCase())}
              disabled={excluindo}
              autoComplete="off"
              className="mt-2 h-12 w-full rounded-xl border border-line bg-card-hover px-3 text-sm text-ink focus:border-brand focus:outline-none disabled:opacity-60"
            />
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => { setConfirmandoConta(false); setConfirmacaoConta('') }}
                disabled={excluindo}
                className="h-11 flex-1 rounded-xl border border-line text-sm font-semibold text-ink-2 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={excluirConta}
                disabled={excluindo || confirmacaoConta !== 'EXCLUIR'}
                className="h-11 flex-1 rounded-xl bg-down text-sm font-semibold text-white disabled:opacity-50"
              >
                {excluindo ? 'Excluindo...' : 'Excluir definitivamente'}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirmandoConta(true)} className="mt-4 min-h-11 text-sm font-semibold text-down">
            Excluir minha conta
          </button>
        )}
      </div>

    </div>
  )
}

function SecaoDados({ userId, onVoltar }: { userId: string; onVoltar: () => void }) {
  const [exportando, setExportando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function exportarDados() {
    setExportando(true)
    setErro(null)
    try {
      const [perfil, preferencias, planos, registros, sessoes, medidas, metas, diario, cardio, fotos, posts, comentarios, likes, seguidores, seguindo, bloqueios, denuncias, streak, desafio] = await Promise.all([
        supabase.from('perfis').select('*').eq('id', userId).maybeSingle(),
        supabase.from('preferencias_usuario').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('planos').select('*').eq('user_id', userId),
        supabase.from('registros').select('*').eq('user_id', userId),
        supabase.from('sessoes_concluidas').select('*').eq('user_id', userId),
        supabase.from('medidas').select('*').eq('user_id', userId),
        supabase.from('metas_nutricionais').select('*').eq('user_id', userId),
        supabase.from('diario_alimentar').select('*').eq('user_id', userId),
        supabase.from('cardio_sessoes').select('*').eq('user_id', userId),
        supabase.from('fotos_progresso').select('id, data, angulo, storage_bucket, storage_path').eq('user_id', userId),
        supabase.from('posts_proprios').select('*'),
        supabase.from('post_comments').select('*').eq('user_id', userId),
        supabase.from('post_likes').select('*').eq('user_id', userId),
        supabase.from('seguidores').select('*').eq('seguido_id', userId),
        supabase.from('seguidores').select('*').eq('seguidor_id', userId),
        supabase.from('usuarios_bloqueados').select('*').eq('bloqueador_id', userId),
        supabase.from('denuncias_social').select('*').eq('denunciante_id', userId),
        supabase.from('streaks').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('desafio_progresso').select('*').eq('user_id', userId),
      ])
      const consultas = [perfil, preferencias, planos, registros, sessoes, medidas, metas, diario, cardio, fotos, posts, comentarios, likes, seguidores, seguindo, bloqueios, denuncias, streak, desafio]
      const primeiraFalha = consultas.find((consulta) => consulta.error)?.error
      if (primeiraFalha) throw primeiraFalha
      const idsPlanos = (planos.data ?? []).map((plano) => plano.id)
      const sessoesRotina = idsPlanos.length > 0 ? await supabase.from('plano_sessoes').select('*').in('plano_id', idsPlanos) : { data: [] }
      const idsSessoesRotina = (sessoesRotina.data ?? []).map((sessao) => sessao.id)
      const itens = idsSessoesRotina.length > 0 ? await supabase.from('plano_itens').select('*').in('sessao_id', idsSessoesRotina) : { data: [] }
      if ('error' in sessoesRotina && sessoesRotina.error) throw sessoesRotina.error
      if ('error' in itens && itens.error) throw itens.error
      const pacote = montarPacoteExportacao(userId, {
        perfil: perfil.data,
        preferencias: preferencias.data,
        rotinas: planos.data,
        sessoes_rotina: sessoesRotina.data,
        itens_rotina: itens.data,
        registros: registros.data,
        sessoes: sessoes.data,
        medidas: medidas.data,
        metas_nutricionais: metas.data,
        diario_alimentar: diario.data,
        cardio: cardio.data,
        fotos: fotos.data,
        posts: posts.data,
        comentarios: comentarios.data,
        curtidas: likes.data,
        seguidores: seguidores.data,
        seguindo: seguindo.data,
        bloqueios: bloqueios.data,
        denuncias: denuncias.data,
        streak: streak.data,
        desafio: desafio.data,
        midias: {
          observacao: 'O JSON contém referências de mídia. Os arquivos binários não são incorporados.',
          fotos_progresso: fotos.data,
          posts: (posts.data ?? []).map((post) => ({ id: post.id, foto_url: post.foto_url, foto_path: post.foto_path })),
          avatar_url: perfil.data?.foto_url ?? null,
        },
      }, new Date().toISOString())
      const blob = new Blob([JSON.stringify(pacote, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `viveci-meus-dados-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não deu pra exportar seus dados agora.')
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="pb-4">
      <Cabecalho titulo="Meus dados" onVoltar={onVoltar} />
      <div className="mt-5 rounded-2xl border border-line bg-card p-6">
        <h3 className="text-[17px] font-semibold">Exportar tudo</h3>
        <p className="mt-1 text-sm text-ink-2">
          Baixa um JSON com perfil, preferências, treinos, nutrição, medidas e atividade social. Fotos são representadas
          por referências e não são incorporadas ao arquivo.
        </p>
        <button
          onClick={exportarDados}
          disabled={exportando}
          className="mt-4 h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          {exportando ? 'Exportando...' : 'Exportar meus dados'}
        </button>
        {erro && <p className="mt-3 text-sm text-down">{erro}</p>}
      </div>
    </div>
  )
}

function SecaoAplicativo({ onVoltar }: { onVoltar: () => void }) {
  const [limpando, setLimpando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  async function limparCache() {
    setLimpando(true)
    setMensagem(null)
    try {
      if ('caches' in window) {
        const nomes = await caches.keys()
        await Promise.all(nomes.map((n) => caches.delete(n)))
      }
      setMensagem('Cache limpo. Recarregue o app pra buscar tudo de novo.')
    } finally {
      setLimpando(false)
    }
  }

  return (
    <div className="pb-4">
      <Cabecalho titulo="Aplicativo" onVoltar={onVoltar} />
      <div className="mt-5 rounded-2xl border border-line bg-card p-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-2">Versão</span>
          <span className="text-ink">1.0.0</span>
        </div>
        <button
          onClick={limparCache}
          disabled={limpando}
          className="mt-4 h-11 w-full rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover disabled:opacity-60"
        >
          {limpando ? 'Limpando...' : 'Limpar cache'}
        </button>
        {mensagem && <p className="mt-3 text-xs text-ink-2">{mensagem}</p>}
      </div>
    </div>
  )
}

function SecaoSobre({ onVoltar }: { onVoltar: () => void }) {
  return (
    <div className="pb-4">
      <Cabecalho titulo="Sobre o VIVECI" onVoltar={onVoltar} />
      <div className="mt-5 rounded-2xl border border-line bg-card p-6 text-center">
        <p className="text-[19px] font-bold tracking-tight text-ink">VIVECI</p>
        <p className="mt-2 text-sm text-ink-2">
          Vim. Vi. Venci.
          <br />
          Treine. Evolua. Conquiste.
        </p>
        <p className="mt-4 text-xs text-ink-2">Versão 1.0.0</p>
      </div>
    </div>
  )
}

export default function Configuracoes() {
  const { sessao } = useSessao()
  const navigate = useNavigate()
  const [secao, setSecao] = useState<Secao>('menu')

  if (!sessao) {
    return (
      <Page title="Configurações">
        <Empty text="Carregando..." />
      </Page>
    )
  }

  const userId = sessao.user.id

  if (secao === 'perfil') return <SecaoPerfil userId={userId} onVoltar={() => setSecao('menu')} />
  if (secao === 'treinamento') return <SecaoTreinamento userId={userId} onVoltar={() => setSecao('menu')} />
  if (secao === 'nutricao') return <SecaoNutricao userId={userId} onVoltar={() => setSecao('menu')} />
  if (secao === 'aparencia') return <SecaoAparencia userId={userId} onVoltar={() => setSecao('menu')} />
  if (secao === 'privacidade') return <SecaoPrivacidade userId={userId} onVoltar={() => setSecao('menu')} />
  if (secao === 'dados') return <SecaoDados userId={userId} onVoltar={() => setSecao('menu')} />
  if (secao === 'aplicativo') return <SecaoAplicativo onVoltar={() => setSecao('menu')} />
  if (secao === 'sobre') return <SecaoSobre onVoltar={() => setSecao('menu')} />

  return (
    <Page title="Configurações">
      <div className="mt-6 flex items-center gap-3">
        <button onClick={() => navigate('/perfil')} aria-label="Voltar ao perfil" className="text-ink-2 hover:text-ink">
          <ChevronLeft size={22} strokeWidth={1.75} />
        </button>
        <p className="text-sm text-ink-2">Personalize sua experiência no VIVECI</p>
      </div>

      <div className="mt-5 divide-y divide-line/70 border-y border-line/70">
        {CATEGORIAS.map(({ secao: s, icone: Icone, titulo, descricao }) => (
          <button
            key={s}
            onClick={() => setSecao(s)}
            className="flex min-h-20 w-full items-center gap-4 px-1 py-4 text-left transition-colors hover:bg-card-hover/40 sm:px-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center text-ink-2">
              <Icone size={19} strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{titulo}</p>
              <p className="truncate text-xs text-ink-2">{descricao}</p>
            </div>
            <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 text-ink-3" />
          </button>
        ))}
      </div>
    </Page>
  )
}
