import { createClient } from 'npm:@supabase/supabase-js@2.57.4'
import { importPKCS8, SignJWT } from 'npm:jose@6.1.0'

type Notificacao = { id:number; destinatario_id:string; tipo:string; titulo:string; corpo:string; rota:string; enviada_em:string|null }
type Webhook = { type:'INSERT'; table:'notificacoes_push'; schema:'public'; record:Notificacao }
type ContaFirebase = { project_id:string; client_email:string; private_key:string; token_uri?:string }

function resposta(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
}

Deno.serve(async (requisicao) => {
  if (requisicao.method !== 'POST') return resposta({ erro: 'Método inválido.' }, 405)
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const autorizacao = requisicao.headers.get('authorization')
  if (!serviceRole || autorizacao !== `Bearer ${serviceRole}`) return resposta({ erro: 'Não autorizado.' }, 401)

  let payload: Webhook
  try { payload = await requisicao.json() } catch { return resposta({ erro: 'Corpo inválido.' }, 400) }
  if (payload.type !== 'INSERT' || payload.table !== 'notificacoes_push' || payload.schema !== 'public' || !payload.record?.id) return resposta({ erro: 'Evento inválido.' }, 400)
  if (payload.record.enviada_em) return resposta({ ignorada: true })

  const url = Deno.env.get('SUPABASE_URL')
  const contaBruta = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')
  if (!url || !contaBruta) return resposta({ erro: 'Servidor não configurado.' }, 500)
  let conta: ContaFirebase
  try { conta = JSON.parse(contaBruta) } catch { return resposta({ erro: 'Credencial inválida.' }, 500) }
  if (!conta.project_id || !conta.client_email || !conta.private_key) return resposta({ erro: 'Credencial incompleta.' }, 500)

  const admin = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: tokens, error: erroTokens } = await admin.from('push_tokens').select('id,token').eq('user_id',payload.record.destinatario_id).eq('ativo',true).limit(10)
  if (erroTokens) return resposta({ erro: 'Falha ao localizar aparelhos.' }, 500)
  if (!tokens?.length) {
    await admin.from('notificacoes_push').update({ enviada_em: new Date().toISOString() }).eq('id',payload.record.id)
    return resposta({ enviados: 0 })
  }

  const agora = Math.floor(Date.now()/1000)
  const chave = await importPKCS8(conta.private_key.replace(/\\n/g,'\n'),'RS256')
  const jwt = await new SignJWT({ scope:'https://www.googleapis.com/auth/firebase.messaging' }).setProtectedHeader({alg:'RS256',typ:'JWT'}).setIssuer(conta.client_email).setSubject(conta.client_email).setAudience(conta.token_uri??'https://oauth2.googleapis.com/token').setIssuedAt(agora).setExpirationTime(agora+3600).sign(chave)
  const oauth = await fetch(conta.token_uri??'https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:jwt})})
  if (!oauth.ok) return resposta({ erro:'Falha ao autenticar o serviço de push.' },500)
  const accessToken = String((await oauth.json()).access_token??'')
  if (!accessToken) return resposta({ erro:'Token de envio ausente.' },500)

  let enviados = 0
  for (const item of tokens) {
    const envio = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(conta.project_id)}/messages:send`,{
      method:'POST',headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},
      body:JSON.stringify({message:{token:item.token,notification:{title:payload.record.titulo,body:payload.record.corpo},data:{rota:payload.record.rota,tipo:payload.record.tipo},android:{priority:'high',notification:{channel_id:'viveci_social',sound:'default'}}}}),
    })
    if (envio.ok) enviados++
    else {
      const falha = await envio.text()
      if (envio.status===404 || falha.includes('UNREGISTERED') || falha.includes('INVALID_ARGUMENT')) await admin.from('push_tokens').update({ativo:false,atualizado_em:new Date().toISOString()}).eq('id',item.id)
    }
  }
  await admin.from('notificacoes_push').update({ enviada_em:new Date().toISOString() }).eq('id',payload.record.id)
  return resposta({ enviados })
})
