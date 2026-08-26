import { ChevronLeft } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Empty } from '../components/Empty'
import { useConexoesSociais } from '../lib/social/seguidores'

export default function ConexoesSociais() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tipo = params.get('aba') === 'seguindo' ? 'seguindo' : 'seguidores'
  const { pessoas, carregando, erro } = useConexoesSociais(id, tipo)

  return (
    <div className="animar-entrada mx-auto max-w-[640px] pb-4">
      <div className="flex min-h-14 items-center gap-3 border-b border-line/60">
        <button onClick={() => navigate(-1)} aria-label="Voltar" className="flex size-11 items-center justify-center text-ink-2 hover:text-ink">
          <ChevronLeft size={22} strokeWidth={1.75} />
        </button>
        <h1 className="text-lg font-semibold">Conexões</h1>
      </div>

      <div className="mt-4 flex border-b border-line/60">
        {(['seguidores', 'seguindo'] as const).map((aba) => (
          <button
            key={aba}
            onClick={() => setParams({ aba })}
            className={`relative min-h-12 flex-1 text-xs font-semibold uppercase tracking-[0.06em] ${tipo === aba ? 'text-ink after:absolute after:inset-x-8 after:bottom-0 after:h-px after:bg-brand' : 'text-ink-3'}`}
          >
            {aba === 'seguidores' ? 'Seguidores' : 'Seguindo'}
          </button>
        ))}
      </div>

      {carregando ? <Empty text="Carregando pessoas..." /> : erro ? <Empty text="Não foi possível carregar as pessoas." /> : pessoas.length === 0 ? (
        <Empty text={tipo === 'seguidores' ? 'Nenhum seguidor ainda.' : 'Ainda não segue ninguém.'} />
      ) : (
        <div className="divide-y divide-line/60">
          {pessoas.map((pessoa) => (
            <button key={pessoa.id} onClick={() => navigate(`/social/usuario/${pessoa.id}`)} className="flex min-h-18 w-full items-center gap-3 py-3 text-left">
              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-card-hover">
                {pessoa.foto_url ? <img src={pessoa.foto_url} alt="" className="h-full w-full object-cover" /> : <span className="font-semibold text-ink-3">{pessoa.nome?.[0]?.toUpperCase() ?? '?'}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{pessoa.nome ?? 'Atleta VIVECI'}</p>
                {pessoa.bio && <p className="mt-0.5 truncate text-xs text-ink-2">{pessoa.bio}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
