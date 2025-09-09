// FibroDiário Service Worker
// Versão do cache - incremente quando houver mudanças
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `fibrodiario-${CACHE_VERSION}`;
const OFFLINE_PAGE = '/dorlog/offline.html';

// URLs essenciais para cache
const STATIC_ASSETS = [
  '/dorlog/',
  '/dorlog/manifest.json',
  '/dorlog/icons/icon-192x192.png',
  '/dorlog/icons/icon-512x512.png'
];

// URLs de dados que devem ser cache-first
const DATA_CACHE_PATTERNS = [
  /\/api\/.*$/,
  /\/reports\/.*$/
];

// URLs que devem ser network-first
const NETWORK_FIRST_PATTERNS = [
  /\/auth\/.*$/,
  /\/firebase\/.*$/
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Cache aberto');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Assets em cache');
        // Força a ativação imediata
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Erro no cache', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Remove caches antigos
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Removendo cache antigo', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Ativo e controlando páginas');
        // Assume controle imediato de todas as páginas
        return self.clients.claim();
      })
  );
});

// Interceptação de requisições (fetch)
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignora requisições de outros domínios (CDNs, etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);
  
  // Estratégia Network-First para autenticação e dados críticos
  if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Estratégia Cache-First para assets estáticos
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Estratégia Stale-While-Revalidate para dados da aplicação
  if (DATA_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // Estratégia padrão: Network-First para páginas HTML
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    event.respondWith(networkFirstWithOffline(event.request));
    return;
  }

  // Para todo o resto, usa Cache-First
  event.respondWith(cacheFirst(event.request));
});

// Estratégia Network-First
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Se a resposta é válida, coloca no cache
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🌐 Network failed, tentando cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Estratégia Cache-First
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Network e cache falharam:', request.url);
    throw error;
  }
}

// Estratégia Stale-While-Revalidate
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  // Busca da rede em background
  const networkPromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.status === 200) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('🌐 Network falhou em background:', request.url);
    });

  // Retorna cache imediatamente se disponível, senão espera a rede
  return cachedResponse || networkPromise;
}

// Network-First com página offline como fallback
async function networkFirstWithOffline(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🌐 Network failed, tentando cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback para página offline
    console.log('📱 Mostrando página offline');
    return caches.match(OFFLINE_PAGE);
  }
}

// Verifica se é um asset estático
function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2'];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Listener para mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⚡ Service Worker: Skip waiting solicitado');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    caches.open(CACHE_NAME)
      .then(cache => cache.keys())
      .then(keys => {
        event.ports[0].postMessage({
          cacheVersion: CACHE_VERSION,
          cachedUrls: keys.length,
          isOnline: navigator.onLine
        });
      });
  }
});

// Sincronização em background (para PWAs avançadas)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pain-data') {
    console.log('🔄 Background Sync: Sincronizando dados de dor');
    event.waitUntil(syncPainData());
  }
});

// Função para sincronizar dados offline (placeholder)
async function syncPainData() {
  try {
    // Aqui implementaria a lógica para sincronizar dados
    // que foram salvos offline no IndexedDB
    console.log('📊 Sincronizando dados de saúde...');
    return Promise.resolve();
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    throw error;
  }
}

// Push notifications (para funcionalidades futuras)
self.addEventListener('push', (event) => {
  console.log('📩 Push notification recebida');
  
  const options = {
    body: 'Lembrete: Como está se sentindo hoje?',
    icon: '/dorlog/icons/icon-192x192.png',
    badge: '/dorlog/icons/icon-72x72.png',
    tag: 'health-reminder',
    requireInteraction: true,
    actions: [
      {
        action: 'quick-quiz',
        title: 'Responder Quiz'
      },
      {
        action: 'dismiss',
        title: 'Dispensar'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('FibroDiário', options)
  );
});

// Click em notificações
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'quick-quiz') {
    event.waitUntil(
      clients.openWindow('/dorlog/quiz')
    );
  } else {
    event.waitUntil(
      clients.openWindow('/dorlog/')
    );
  }
});