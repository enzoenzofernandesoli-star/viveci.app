import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

async function listarPaths(admin: ReturnType<typeof createClient>, bucket: string, pasta: string): Promise<string[]> {
  const { data, error } = await admin.storage.from(bucket).list(pasta, { limit: 1000 })
  if (error) return []
  const resultado: string[] = []
  for (const item of data ?? []) {
    const path = `${pasta}/${item.name}`
    if (item.id) resultado.push(path)
    else resultado.push(...await listarPaths(admin, bucket, path))
  }
  return resultado
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return new Response('Método inválido', { status: 405, headers: cors })

  const url = Deno.env.get('SUPABASE_URL')!
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const authorization = req.headers.get('Authorization')
  if (!authorization) return new Response('Não autorizado', { status: 401, headers: cors })

  const cliente = createClient(url, anon, { global: { headers: { Authorization: authorization } } })
  const { data: { user }, error } = await cliente.auth.getUser()
  if (error || !user) return new Response('Não autorizado', { status: 401, headers: cors })

  const admin = createClient(url, serviceRole)
  for (const bucket of ['midia-publica', 'progresso-privado', 'Fotos']) {
    const paths = await listarPaths(admin, bucket, user.id)
    if (paths.length > 0) await admin.storage.from(bucket).remove(paths)
  }

  const { error: erroExclusao } = await admin.auth.admin.deleteUser(user.id)
  if (erroExclusao) return new Response('Não foi possível excluir a conta', { status: 500, headers: cors })
  return new Response(JSON.stringify({ excluida: true }), { headers: { ...cors, 'Content-Type': 'application/json' } })
})

