import { useEffect } from 'react'
import { useSessao } from '../lib/auth'
import { iniciarNotificacoesPush } from '../lib/notificacoesPush'

export function AtivadorNotificacoes() {
  const { sessao } = useSessao()
  useEffect(() => {
    if (!sessao?.user.id) return
    let limpar: () => void = () => undefined
    let cancelado = false
    void iniciarNotificacoesPush().then((remover) => { if (cancelado) remover(); else limpar = remover })
    return () => { cancelado = true; limpar() }
  }, [sessao?.user.id])
  return null
}
