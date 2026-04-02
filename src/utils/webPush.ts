/**
 * Web Push 工具：订阅推送、请求权限、处理推送事件
 * 用于实现类似微信的消息提醒（锁屏/通知栏）
 */

const VAPID_PUBLIC_KEY =
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib27-VVQSIhxOpcT3SbVtgaUpQnYldRz_4yd0w3txZCXQ83xmT6SJ1AHAkB0'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/** 检查浏览器是否支持 Web Push */
export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/** 获取当前通知权限状态 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied'
  return Notification.permission
}

/** 请求通知权限 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  const result = await Notification.requestPermission()
  return result
}

/** 注册 Service Worker 并订阅 Web Push */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null

  try {
    const registration = await navigator.serviceWorker.ready
    const permission = await requestNotificationPermission()
    if (permission !== 'granted') return null

    const existingSubscription = await registration.pushManager.getSubscription()
    if (existingSubscription) return existingSubscription

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    })

    // 将订阅信息发送到后端（后端需提供 API 保存）
    await sendSubscriptionToBackend(subscription)
    return subscription
  } catch (err) {
    console.error('[WebPush] 订阅失败:', err)
    return null
  }
}

/** 将推送订阅发送到后端保存 */
async function sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
  const payload = subscription.toJSON()
  try {
    // 生产环境：调用后端 API 保存订阅，关联当前用户
    // await fetch('/api/push/subscribe', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ subscription: payload }),
    // })
    // 本地存储备用（后端未就绪时）
    localStorage.setItem('ohmee_push_subscription', JSON.stringify(payload))
  } catch {
    localStorage.setItem('ohmee_push_subscription', JSON.stringify(payload))
  }
}

/** 取消推送订阅 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await subscription.unsubscribe()
      localStorage.removeItem('ohmee_push_subscription')
      return true
    }
  } catch (err) {
    console.error('[WebPush] 取消订阅失败:', err)
  }
  return false
}
