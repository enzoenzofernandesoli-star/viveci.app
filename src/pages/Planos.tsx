import { Page } from '../components/Page'
import { Empty } from '../components/Empty'
import { useSessao } from '../lib/auth'
import { usePerfil } from '../lib/perfil'
import type { Plano } from '../lib/planos'

type CardPlano = {
  id: Plano
  nome: string
  preco: string
  recursos: string[]
}

const PLANOS: CardPlano[] = [
  {
    id: 'free',
    nome: 'Free',
    preco: 'Grátis',
    recursos: ['Até 4 rotinas de treino', 'Todos os recursos atuais do VIVECI'],
  },
  {
    id: 'pro',
    nome: 'Pro',
    preco: 'Em breve',
    recursos: ['Rotinas de treino ilimitadas', 'Todos os recursos atuais do VIVECI'],
  },
]

export default function Planos() {
  const { sessao } = useSessao()
  const { perfil, carregando } = usePerfil(sessao?.user.id)

  if (carregando) {
    return (
      <Page title="Planos">
        <Empty text="Carregando..." />
      </Page>
    )
  }

  const planoAtual = perfil?.plano ?? 'free'

  return (
    <Page title="Planos">
      <div className="mt-6 border-y border-line/70 lg:grid lg:grid-cols-2 lg:divide-x lg:divide-line/70">
        {PLANOS.map((p) => {
          const ativo = p.id === planoAtual
          return (
            <section key={p.id} className="border-b border-line/70 py-8 last:border-b-0 lg:border-b-0 lg:px-8 lg:first:pl-0 lg:last:pr-0">
              <div className="flex items-center justify-between">
                <h2 className="text-[17px] font-semibold">{p.nome}</h2>
                {ativo && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand">Plano atual</span>
                )}
              </div>
              <p className="mt-1 text-sm text-ink-2">{p.preco}</p>

              <ul className="mt-4 space-y-1.5">
                {p.recursos.map((r) => (
                  <li key={r} className="text-sm text-ink-2">
                    · {r}
                  </li>
                ))}
              </ul>

              {!ativo && <p className="mt-6 border-t border-line/70 pt-5 text-xs leading-5 text-ink-2">O plano Pro e o pagamento ainda não estão disponíveis.</p>}
            </section>
          )
        })}
      </div>
      <p className="mt-5 text-xs leading-5 text-ink-2">Hoje, a única diferença funcional entre os planos é o limite de rotinas. Nenhum recurso será cobrado ou bloqueado sem aviso.</p>
    </Page>
  )
}
