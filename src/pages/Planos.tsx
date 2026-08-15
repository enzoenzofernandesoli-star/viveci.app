import { useState } from 'react'
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
    recursos: ['Rotinas de treino ilimitadas', 'Diário alimentar', 'Mapa corporal e evolução'],
  },
  {
    id: 'pro',
    nome: 'Pro',
    preco: 'Em breve',
    recursos: ['Tudo do Free, por enquanto', 'Novos recursos chegando'],
  },
]

export default function Planos() {
  const { sessao } = useSessao()
  const { perfil, carregando } = usePerfil(sessao?.user.id)
  const [aviso, setAviso] = useState(false)

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
      <div className="mt-6 space-y-4">
        {PLANOS.map((p) => {
          const ativo = p.id === planoAtual
          return (
            <div key={p.id} className={`rounded-2xl border p-6 ${ativo ? 'border-brand' : 'border-line'} bg-card`}>
              <div className="flex items-center justify-between">
                <h2 className="text-[17px] font-semibold">{p.nome}</h2>
                {ativo && (
                  <span className="rounded-full bg-brand/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-brand">
                    Seu plano
                  </span>
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

              {!ativo && (
                <button
                  onClick={() => setAviso(true)}
                  className="mt-5 h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
                >
                  Assinar
                </button>
              )}
            </div>
          )
        })}

        {aviso && <p className="text-center text-sm text-ink-2">Pagamento ainda não está disponível. Volte em breve.</p>}
      </div>
    </Page>
  )
}
