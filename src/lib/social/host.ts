import { useEffect, useState } from 'react'
import { supabase } from '../supabase.ts'

export function useEhHost(userId: string | undefined) {
  const [ehHost, setEhHost] = useState(false)
  const [carregando, setCarregando] = useState(Boolean(userId))

  useEffect(() => {
    if (!userId) {
      setEhHost(false)
      setCarregando(false)
      return
    }
    let cancelado = false
    setCarregando(true)
    supabase.rpc('sou_host').then(({ data }) => {
      if (!cancelado) {
        setEhHost(data === true)
        setCarregando(false)
      }
    })
    return () => { cancelado = true }
  }, [userId])

  return { ehHost, carregando }
}

export function useContaBanida(userId: string | undefined) {
  const [banida, setBanida] = useState(false)
  const [carregando, setCarregando] = useState(Boolean(userId))
  const [erro, setErro] = useState(false)

  useEffect(() => {
    if (!userId) {
      setBanida(false)
      setCarregando(false)
      setErro(false)
      return
    }
    let cancelado = false
    setCarregando(true)
    setErro(false)
    supabase.rpc('minha_conta_esta_banida').then(({ data, error }) => {
      if (!cancelado) {
        setBanida(!error && data === true)
        setErro(Boolean(error))
        setCarregando(false)
      }
    })
    return () => { cancelado = true }
  }, [userId])

  return { banida, carregando, erro }
}

export async function banirUsuario(usuarioId: string, motivo = 'Violação das regras da comunidade') {
  const { error } = await supabase.rpc('banir_usuario', { p_usuario_id: usuarioId, p_motivo: motivo })
  if (error) throw error
}
