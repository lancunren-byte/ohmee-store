import React, { useState } from 'react'
import { List, Button, Toast, Switch } from 'antd-mobile'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'
import dayjs from 'dayjs'
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
} from '../../utils/webPush'
import { APP_VERSION, APP_BUILD } from '../../version'

const API_BASE = import.meta.env.VITE_API_URL || ''

interface ServerVersion {
  version: string
  build: number
  force_update: boolean
  apk_url: string
  release_notes: string
}

const LANG_OPTIONS = [
  { key: 'zh', label: '中文' },
  { key: 'en', label: 'English' },
  { key: 'vi', label: 'Tiếng Việt' },
]

export default function MobileProfile() {
  const navigate = useNavigate()
  const { currentUser, stores, employees, attendances, regions, logout } = useAppStore()
  const [lang, setLang] = useState(localStorage.getItem('ohmee-lang') || 'zh')
  const [pushEnabled, setPushEnabled] = useState(
    () => getNotificationPermission() === 'granted' || !!localStorage.getItem('ohmee_push_subscription'),
  )
  const [pushSupported] = useState(isPushSupported)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [serverVersion, setServerVersion] = useState<ServerVersion | null>(null)
  const [updateChecked, setUpdateChecked] = useState(false)

  if (!currentUser) {
    navigate('/mobile/login')
    return null
  }

  const store = stores.find((s) => s.id === currentUser.storeId)
  const emp = employees.find((e) => e.id === currentUser.id)
  const region = regions.find((r) => r.id === currentUser.regionId)

  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD')
  const monthEnd = dayjs().format('YYYY-MM-DD')
  const monthAttendances = attendances.filter(
    (a) => a.empId === currentUser.id && a.date >= monthStart && a.date <= monthEnd,
  )
  const monthStats = {
    normal: monthAttendances.filter((a) => a.status === '正常').length,
    late: monthAttendances.filter((a) => a.status === '迟到' || a.status === '迟到早退').length,
    early: monthAttendances.filter((a) => a.status === '早退' || a.status === '迟到早退').length,
    absent: monthAttendances.filter((a) => a.status === '缺勤' || a.status === '未打卡').length,
  }

  const roleColorMap: Record<string, string> = {
    督导: '#722ed1',
    稽核专员: '#1677ff',
    店长: '#13c2c2',
    全职店员: '#52c41a',
    管培生: '#fa8c16',
    兼职店员: '#eb2f96',
  }

  const handleLangChange = (key: string) => {
    setLang(key)
    localStorage.setItem('ohmee-lang', key)
    Toast.show({ content: '语言设置已保存', icon: 'success' })
  }

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true)
    try {
      const res = await fetch(`${API_BASE}/api/app-version`)
      if (!res.ok) throw new Error('请求失败')
      const data: ServerVersion = await res.json()
      setServerVersion(data)
      setUpdateChecked(true)
      const isNewer =
        data.version.localeCompare(APP_VERSION, undefined, { numeric: true, sensitivity: 'base' }) > 0 ||
        data.build > APP_BUILD
      if (!isNewer) {
        Toast.show({ content: '已是最新版本', icon: 'success' })
      }
    } catch {
      Toast.show({ content: '检查失败，请检查网络', icon: 'fail' })
    } finally {
      setCheckingUpdate(false)
    }
  }

  const handleUpdate = () => {
    if (serverVersion?.apk_url) {
      window.open(serverVersion.apk_url, '_system')
    }
  }

  const hasNewVersion =
    serverVersion &&
    (serverVersion.version.localeCompare(APP_VERSION, undefined, { numeric: true, sensitivity: 'base' }) > 0 ||
      serverVersion.build > APP_BUILD)

  const handleLogout = () => {
    logout()
    Toast.show({ content: '已退出登录', icon: 'success' })
    navigate('/mobile/login')
  }

  const handlePushToggle = async (checked: boolean) => {
    if (!pushSupported) {
      Toast.show({ content: '当前浏览器不支持消息推送', icon: 'fail' })
      return
    }
    if (checked) {
      const sub = await subscribeToPush()
      setPushEnabled(!!sub)
      Toast.show({ content: sub ? '已开启消息提醒' : '请允许通知权限', icon: sub ? 'success' : 'fail' })
    } else {
      await unsubscribeFromPush()
      setPushEnabled(false)
      Toast.show({ content: '已关闭消息提醒', icon: 'success' })
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: 80 }}>
      <div
        style={{
          background: 'linear-gradient(145deg, #ff3b30 0%, #e6232a 55%, #a61010 100%)',
          padding: '32px 24px 48px',
          textAlign: 'center',
          color: '#fff',
        }}
      >
        <div
          style={{
            background: roleColorMap[currentUser.role] || '#fff',
            color: '#fff',
            fontSize: 24,
            width: 72,
            height: 72,
            lineHeight: '72px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            border: '3px solid rgba(255,255,255,0.4)',
          }}
        >
          {currentUser.name.charAt(0)}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{currentUser.name}</div>
        <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>{currentUser.empNo}</div>
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.2)',
            padding: '3px 12px',
            borderRadius: 12,
            marginTop: 8,
            fontSize: 13,
          }}
        >
          {currentUser.role}
        </div>
      </div>

      <div style={{ padding: 16, marginTop: -24 }}>
        {/* 月度统计卡 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            marginBottom: 16,
          }}
        >
          {[
            { label: '正常', value: monthStats.normal, color: '#52c41a' },
            { label: '迟到', value: monthStats.late, color: '#faad14' },
            { label: '早退', value: monthStats.early, color: '#fa8c16' },
            { label: '缺勤', value: monthStats.absent, color: '#ff4d4f' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: '#fff',
                borderRadius: 10,
                padding: 12,
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,.05)',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
          <List>
            <List.Item title="所属门店" extra={store?.storeName || '-'} />
            <List.Item title="门店编号" extra={store?.storeNo || '-'} />
            <List.Item title="门店类型" extra={store?.type || '-'} />
            <List.Item title="所属区域" extra={region?.name || '-'} />
            <List.Item title="入职日期" extra={emp?.joinDate || '-'} />
          </List>
        </div>

        {/* 消息提醒（Web Push） */}
        {pushSupported && (
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <List header="消息提醒">
              <List.Item
                title="推送通知"
                description="开启后可在锁屏/通知栏收到借调、任务等提醒，类似微信"
                extra={<Switch checked={pushEnabled} onChange={handlePushToggle} />}
              />
            </List>
          </div>
        )}

        {/* 语言设置 */}
        <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
          <List header="语言设置">
            {LANG_OPTIONS.map((opt) => (
              <List.Item
                key={opt.key}
                title={opt.label}
                extra={lang === opt.key ? '✓' : ''}
                onClick={() => handleLangChange(opt.key)}
                style={{ color: lang === opt.key ? '#e6232a' : undefined }}
              />
            ))}
          </List>
        </div>

        {/* 版本与更新 */}
        <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
          <List header="关于应用">
            <List.Item
              title="当前版本"
              extra={<span style={{ color: '#999', fontSize: 13 }}>v{APP_VERSION} (build {APP_BUILD})</span>}
            />
            {updateChecked && serverVersion && (
              <List.Item
                title="最新版本"
                extra={
                  <span style={{ color: hasNewVersion ? '#e6232a' : '#52c41a', fontSize: 13 }}>
                    v{serverVersion.version}
                    {hasNewVersion ? ' 有更新' : ' 已最新'}
                  </span>
                }
              />
            )}
            {updateChecked && serverVersion?.release_notes && hasNewVersion && (
              <List.Item
                title="更新内容"
                description={serverVersion.release_notes}
              />
            )}
          </List>
          <div style={{ padding: '8px 16px 16px', display: 'flex', gap: 8 }}>
            <Button
              block
              color="primary"
              fill="outline"
              size="middle"
              style={{ borderRadius: 8, '--border-color': '#e6232a', '--text-color': '#e6232a', flex: 1 }}
              loading={checkingUpdate}
              onClick={handleCheckUpdate}
            >
              检查更新
            </Button>
            {hasNewVersion && (
              <Button
                block
                color="primary"
                size="middle"
                style={{ borderRadius: 8, '--background-color': '#e6232a', flex: 1 }}
                onClick={handleUpdate}
              >
                立即更新
              </Button>
            )}
          </div>
        </div>

        <Button
          color="danger"
          fill="outline"
          block
          size="large"
          style={{ borderRadius: 8, '--border-color': '#e6232a', '--text-color': '#e6232a' }}
          onClick={handleLogout}
        >
          退出登录
        </Button>
      </div>
    </div>
  )
}
