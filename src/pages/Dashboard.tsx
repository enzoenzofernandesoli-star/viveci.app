import { MapaCorporal } from '../components/MapaCorporal'
import { Empty } from '../components/Empty'
import { HeroTreino } from '../components/dashboard/HeroTreino'
import { MotivosRecomendacao, ProgressoRecente, ResumoDia, ResumoNutricao, ResumoSocial } from '../components/dashboard/HomeSections'
import { Divider } from '../components/ui/Surface'
import { Eyebrow } from '../components/ui/Typography'
import { useSessao } from '../lib/auth'
import { hojeISO } from '../lib/data'
import { somar, useDia } from '../lib/diario'
import { useMetaAtiva } from '../lib/metaManual'
import { usePerfil, type Perfil as PerfilCalculo } from '../lib/perfil'
import { useRotinas } from '../lib/rotinas'
import { useFeedAmigos } from '../lib/social/posts'
import { useVivici } from '../lib/vivici'

function ConteudoHome({ userId, perfil }: { userId: string; perfil: NonNullable<ReturnType<typeof usePerfil>['perfil']> }) {
  const rotinasState = useRotinas(userId)
  const diarioState = useDia(userId, hojeISO())
  const consumido = somar(diarioState.itens)

  const perfilParaMeta: PerfilCalculo = {
    nome: perfil.nome!,
    sexo: perfil.sexo!,
    idade: perfil.idade!,
    altura_cm: perfil.altura_cm!,
    peso_kg: perfil.peso_kg!,
    dias_semana: perfil.dias_semana!,
    objetivo: perfil.objetivo!,
  }
  const metaState = useMetaAtiva(userId, perfilParaMeta)
  const viviciState = useVivici(userId, rotinasState.rotinas, perfil.dias_semana, consumido.kcal, metaState.metas?.meta_kcal ?? 0)
  const socialState = useFeedAmigos(userId)

  const recomendacao = viviciState.resultado?.recomendacao ?? null
  const rotinaRecomendada = recomendacao ? rotinasState.rotinas.find((rotina) => rotina.id === recomendacao.rotinaId) : undefined

  return (
    <div className="mx-auto w-full max-w-[1120px] animar-entrada">
      <div className="mb-5 flex items-end justify-between gap-4 lg:mb-7">
        <div>
          <Eyebrow>VIVECI / Hoje</Eyebrow>
          <p className="mt-2 text-sm text-ink-2">{perfil.nome ? `Olá, ${perfil.nome}.` : 'Seu próximo passo começa aqui.'}</p>
        </div>
        <p className="hidden text-xs text-ink-3 sm:block">Treine · Evolua · Conquiste</p>
      </div>

      {rotinasState.erro ? (
        <Empty text="Não foi possível carregar suas rotinas. Tente novamente em instantes." />
      ) : (
        <HeroTreino
          recomendacao={recomendacao}
          rotina={rotinaRecomendada}
          carregando={rotinasState.carregando || viviciState.carregando}
          semRotinas={!rotinasState.carregando && rotinasState.rotinas.length === 0}
        />
      )}

      {viviciState.erro && <p className="border-b border-line/60 py-6 text-sm text-ink-2">A análise do seu histórico não está disponível agora.</p>}

      {recomendacao && <MotivosRecomendacao motivos={recomendacao.motivos} />}
      <Divider />

      {viviciState.resultado && (
        <ProgressoRecente eventos={viviciState.resultado.eventosPR} negligenciado={viviciState.resultado.musculoNegligenciado} />
      )}

      <section aria-labelledby="titulo-corpo" className="py-10 lg:py-14">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <Eyebrow>Seu corpo</Eyebrow>
            <h2 id="titulo-corpo" className="mt-2 text-2xl font-semibold tracking-[-0.04em]">O histórico deixa marcas</h2>
          </div>
          <p className="text-xs text-ink-3">Últimos 7 dias</p>
        </div>
        {viviciState.carregando || !viviciState.resultado ? (
          <Empty text="Carregando mapa corporal..." />
        ) : (
          <MapaCorporal
            percentuais={viviciState.resultado.percentuaisSemana}
            desequilibrios={viviciState.resultado.desequilibrios}
            estatisticasPorGrupo={viviciState.resultado.estatisticasPorGrupo}
            modoEditorial
          />
        )}
      </section>

      <Divider />
      <div className="grid lg:grid-cols-2 lg:gap-14">
        {viviciState.resultado && <ResumoDia score={viviciState.resultado.dailyScore} />}
        <ResumoNutricao consumido={consumido} metas={metaState.metas} carregando={diarioState.carregando || metaState.carregando} erro={diarioState.erro ?? metaState.erro} />
      </div>
      <Divider />
      <ResumoSocial posts={socialState.posts} carregando={socialState.carregando} erro={socialState.erro} meuId={userId} />
    </div>
  )
}

export default function Dashboard() {
  const { sessao } = useSessao()
  const perfilState = usePerfil(sessao?.user.id)

  if (perfilState.carregando) return <div className="mx-auto max-w-[1120px]"><Empty text="Carregando sua Home..." /></div>

  if (!perfilState.perfil || !sessao || perfilState.erro) {
    return <div className="mx-auto max-w-[1120px]"><Empty text="Não foi possível carregar seu perfil. Tente novamente em instantes." /></div>
  }

  return <ConteudoHome userId={sessao.user.id} perfil={perfilState.perfil} />
}
