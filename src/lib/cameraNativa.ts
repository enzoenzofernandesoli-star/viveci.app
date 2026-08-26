import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'

function extensaoDoMime(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  return 'jpg'
}

export async function capturarFotoNativa(): Promise<File | null | undefined> {
  if (!Capacitor.isNativePlatform()) return undefined

  try {
    const foto = await Camera.getPhoto({
      source: CameraSource.Camera,
      resultType: CameraResultType.Uri,
      quality: 90,
      correctOrientation: true,
      saveToGallery: false,
    })

    if (!foto.webPath) throw new Error('A câmera não devolveu uma foto válida.')
    const resposta = await fetch(foto.webPath)
    if (!resposta.ok) throw new Error('Não foi possível carregar a foto capturada.')
    const blob = await resposta.blob()
    const mime = blob.type || `image/${foto.format === 'png' ? 'png' : 'jpeg'}`
    return new File([blob], `viveci-${Date.now()}.${extensaoDoMime(mime)}`, { type: mime })
  } catch (falha) {
    const mensagem = falha instanceof Error ? falha.message.toLowerCase() : ''
    if (mensagem.includes('cancel')) return null
    throw falha
  }
}
