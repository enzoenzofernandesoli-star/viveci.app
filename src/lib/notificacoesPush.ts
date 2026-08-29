import { Capacitor } from '@capacitor/core'
import { PushNotifications, type ActionPerformed, type Token } from '@capacitor/push-notifications'
import { supabase } from './supabase'
import { rotaPushSegura } from './notificacoesRegras'

export async function iniciarNotificacoesPush(): Promise<() => void> {
  if (!Capacitor.isNativePlatform()) return () => undefined
  const removiveis = [
    await PushNotifications.addListener('registration', (token: Token) => {
      void supabase.rpc('registrar_push_token', { p_token: token.value, p_plataforma: Capacitor.getPlatform() })
    }),
    await PushNotifications.addListener('registrationError', () => undefined),
    await PushNotifications.addListener('pushNotificationActionPerformed', (acao: ActionPerformed) => {
      const rota = rotaPushSegura(acao.notification.data?.rota)
      if (rota) window.location.assign(rota)
    }),
  ]
  const permissaoAtual = await PushNotifications.checkPermissions()
  const permissao = permissaoAtual.receive === 'prompt' ? await PushNotifications.requestPermissions() : permissaoAtual
  if (permissao.receive === 'granted') {
    if (Capacitor.getPlatform() === 'android') await PushNotifications.createChannel({ id: 'viveci_social', name: 'Mensagens e Social', description: 'Mensagens, convites e interações do VIVECI', importance: 5, visibility: 1, vibration: true })
    await PushNotifications.register()
  }
  return () => { removiveis.forEach((item) => void item.remove()) }
}
