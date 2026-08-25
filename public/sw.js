const CACHE = 'viveci-v3'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  )
})

// Network-first: tenta buscar na rede e guarda uma cópia; se estiver offline,
// serve do cache (ou o app shell, pra rotas ainda não visitadas).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    fetch(event.request)
      .then((resposta) => {
        if (resposta.ok) {
          const copia = resposta.clone()
          event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, copia)))
        }
        return resposta
      })
      .catch(() => caches.match(event.request).then((cache) => cache || caches.match('/'))),
  )
})
