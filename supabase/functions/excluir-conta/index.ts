import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

type AdminClient = ReturnType<typeof createClient>

async function listarArquivos(admin: AdminClient, bucket: string, pasta: string): Promise<string[]> {
  const arquivos: string[] = []
  let offset = 0

  while (true) {
    const { data, error } = await admin.storage.from(bucket).list(pasta, { limit: 100, offset })
    if (error) throw new Error(`Falha ao listar arquivos de ${bucket}.`)
    const itens = data ?? []

    for (const item of itens) {
      const caminho = `${pasta}/${item.name}`
      if (item.id) arquivos.push(caminho)
      else arquivos.push(...await listarArquivos(admin, bucket, caminho))
    }

    if (itens.length < 100) break
    offset += itens.length
  }

  return arquivos
}

async function removerArquivos(admin: AdminClient, bucket: string, userId: string) {
  const arquivos = await listarArquivos(admin, bucket, userId)
  for (let inicio = 0; inicio < arquivos.length; inicio += 100) {
    const { error } = await admin.storage.from(bucket).remove(arquivos.slice(inicio, inicio + 100))
    if (error) throw new Error(`Falha ao remover arquivos de ${bucket}.`)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(JSON.stringify({ ok: true }), { headers: cors })
  if (req.method !== 'POST') return new Response(JSON.stringify({ erro: 'Método inválido.' }), { status: 405, headers: cors })

  const authorization = req.headers.get('Authorization')
  const url = Deno.env.get('SUPABASE_URL')
  const anon = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!authorization || !url || !anon || !serviceRole) {
    return new Response(JSON.stringify({ erro: 'Exclusão indisponível.' }), { status: 401, headers: cors })
  }

  const cliente = createClient(url, anon, { global: { headers: { Authorization: authorization } } })
  const { data: { user }, error: erroAuth } = await cliente.auth.getUser()
  if (erroAuth || !user) return new Response(JSON.stringify({ erro: 'Não autorizado.' }), { status: 401, headers: cors })

  try {
    const admin = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } })

    // Storage não participa da transação do Auth/Postgres. Falhamos antes de
    // excluir o usuário se qualquer arquivo não puder ser removido.
    for (const bucket of ['midia-publica', 'progresso-privado', 'Fotos']) {
      await removerArquivos(admin, bucket, user.id)
    }

    // As tabelas do VIVECI referenciam auth.users com ON DELETE CASCADE.
    const { error: erroExclusao } = await admin.auth.admin.deleteUser(user.id)
    if (erroExclusao) throw new Error('Falha ao excluir Auth e dados relacionados.')

    return new Response(JSON.stringify({ excluida: true }), { headers: cors })
  } catch {
    return new Response(
      JSON.stringify({ erro: 'Não foi possível concluir a exclusão. Seus dados não foram declarados como excluídos.' }),
      { status: 500, headers: cors },
    )
  }
})
