import dayjs from 'dayjs'

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function generateNo(prefix: string, list: { [key: string]: string }[]): string {
  const count = list.length + 1
  return `${prefix}${String(count).padStart(3, '0')}`
}

export function formatDateTime(date?: string | Date): string {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

export function formatDate(date?: string | Date): string {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD')
}

export function formatTime(time?: string): string {
  if (!time) return '-'
  return time
}

export function isLate(checkInTime: string, shiftStartTime: string): boolean {
  const checkIn = dayjs(`2000-01-01 ${checkInTime}`)
  const start = dayjs(`2000-01-01 ${shiftStartTime}`)
  return checkIn.isAfter(start)
}

export function isEarlyLeave(checkOutTime: string, shiftEndTime: string): boolean {
  const checkOut = dayjs(`2000-01-01 ${checkOutTime}`)
  const end = dayjs(`2000-01-01 ${shiftEndTime}`)
  return checkOut.isBefore(end)
}

export function getStoreStatusColor(status: string): string {
  const colors: Record<string, string> = {
    营业中: '#52c41a',
    建设中: '#1677ff',
    已闭店: '#ff4d4f',
    待搬迁: '#faad14',
  }
  return colors[status] || '#999'
}

export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    督导: '#722ed1',
    稽核专员: '#1677ff',
    店长: '#13c2c2',
    全职店员: '#52c41a',
    管培生: '#fa8c16',
    兼职店员: '#eb2f96',
  }
  return colors[role] || '#999'
}

export function getAttendanceStatusColor(status: string): string {
  const colors: Record<string, string> = {
    正常: '#52c41a',
    迟到: '#faad14',
    早退: '#fa8c16',
    迟到早退: '#ff4d4f',
    缺勤: '#ff4d4f',
    未打卡: '#999',
  }
  return colors[status] || '#999'
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function getWeekDay(dateStr: string): string {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return days[new Date(dateStr).getDay()]
}

export function reverseGeocode(lat: number, lng: number): Promise<string> {
  return fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=zh`,
  )
    .then((res) => res.json())
    .then((data) => data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    .catch(() => `${lat.toFixed(6)}, ${lng.toFixed(6)}`)
}
