/**
 * Service Worker Registration for Firebase Cloud Messaging
 * Handles registration and lifecycle of the messaging service worker
 */

/**
 * Registers the Firebase Messaging service worker
 * @returns Promise that resolves to ServiceWorkerRegistration or null
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('⚠️ Service Workers não suportados neste navegador');
    return null;
  }

  try {
    console.log('📝 Registrando service worker...');
    
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
      { scope: '/' }
    );

    console.log('✅ Service worker registrado:', registration.scope);

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('✅ Service worker pronto');

    return registration;
  } catch (error) {
    console.error('❌ Erro ao registrar service worker:', error);
    return null;
  }
}

/**
 * Unregisters all service workers (useful for debugging)
 */
export async function unregisterServiceWorkers(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    for (const registration of registrations) {
      await registration.unregister();
      console.log('🗑️ Service worker removido');
    }
  } catch (error) {
    console.error('❌ Erro ao remover service workers:', error);
  }
}

/**
 * Checks if service worker is registered and active
 * @returns Boolean indicating if service worker is active
 */
export async function isServiceWorkerActive(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    return registration?.active !== null && registration?.active !== undefined;
  } catch (error) {
    console.error('❌ Erro ao verificar service worker:', error);
    return false;
  }
}
