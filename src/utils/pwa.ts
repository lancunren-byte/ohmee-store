/**
 * PWA Service Worker 注册
 * 移动端通过 PWA 实现，支持离线缓存与 Web Push
 */

export function registerSW(): void {
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[PWA] Service Worker 已注册')
        reg.update()
      })
      .catch((err) => console.warn('[PWA] Service Worker 注册失败:', err))
  })
}
