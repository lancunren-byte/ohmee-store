import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'
import dayjs from 'dayjs'

interface MenuItem {
  key: string
  label: string
  sub: string
  icon: React.ReactNode
  badge?: number
  onClick: () => void
}

const CARD_SHADOW = '0 5px 0 #b91c1c, 0 6px 18px rgba(185,28,28,.38), inset 0 1px 0 rgba(255,255,255,.4)'
const CARD_SHADOW_PRESSED = '0 1px 0 #b91c1c, 0 2px 8px rgba(185,28,28,.28)'

function MenuCard({ item }: { item: MenuItem }) {
  const [pressed, setPressed] = useState(false)

  return (
    <div
      onClick={item.onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        background: 'linear-gradient(145deg, #e6232a 0%, #dc2626 55%, #b91c1c 100%)',
        borderRadius: 14,
        cursor: 'pointer',
        boxShadow: pressed ? CARD_SHADOW_PRESSED : CARD_SHADOW,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        padding: '14px 6px 12px',
        transform: pressed ? 'translateY(4px)' : 'translateY(0)',
        transition: 'transform .12s, box-shadow .12s',
        position: 'relative',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        minHeight: 82,
      }}
    >
      {/* 顶部高光 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '45%',
          background: 'linear-gradient(to bottom, rgba(255,255,255,.22), transparent)',
          pointerEvents: 'none',
          borderRadius: '14px 14px 0 0',
        }}
      />
      {item.badge !== undefined && item.badge > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 7,
            right: 7,
            background: '#fff',
            color: '#e6232a',
            borderRadius: 9,
            minWidth: 16,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            fontWeight: 800,
            zIndex: 2,
            padding: '0 3px',
            boxShadow: '0 1px 4px rgba(0,0,0,.18)',
          }}
        >
          {item.badge}
        </div>
      )}
      {item.icon}
      <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.2, textAlign: 'center' }}>{item.label}</div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,.82)', lineHeight: 1.2, textAlign: 'center' }}>{item.sub}</div>
    </div>
  )
}

export default function MobileHome() {
  const navigate = useNavigate()
  const { currentUser, stores, transfers, attendances, schedules } = useAppStore()

  if (!currentUser) {
    navigate('/mobile/login')
    return null
  }

  const store = stores.find((s) => s.id === currentUser.storeId)
  const today = dayjs().format('YYYY-MM-DD')

  const todayAttendance = attendances.filter(
    (a) => a.empId === currentUser.id && a.date === today,
  ).length

  const pendingTransfers = transfers.filter(
    (t) => t.toStoreId === currentUser.storeId && t.status === '待审批',
  ).length

  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD')
  const monthAttendance = attendances.filter(
    (a) => a.empId === currentUser.id && a.date >= monthStart && a.date <= today,
  ).length

  const todaySchedule = schedules.find(
    (s) =>
      s.empId === currentUser.id &&
      s.startDate <= today &&
      s.endDate >= today,
  )

  const isManager =
    currentUser.role === '店长' ||
    currentUser.role === '督导' ||
    currentUser.role === '稽核专员'

  const menuItems: MenuItem[] = [
    {
      key: 'attendance',
      label: '考勤管理',
      sub: '打卡 · 日历',
      onClick: () => navigate('/mobile/attendance'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    ...(isManager
      ? [
          {
            key: 'scheduling',
            label: '排班管理',
            sub: '班次 · 排班',
            onClick: () => navigate('/mobile/scheduling'),
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <circle cx="4" cy="6" r="1.5" fill="#fff" stroke="none" />
                <circle cx="4" cy="12" r="1.5" fill="#fff" stroke="none" />
                <circle cx="4" cy="18" r="1.5" fill="#fff" stroke="none" />
              </svg>
            ),
          },
          {
            key: 'transfer',
            label: '人员借调',
            sub: pendingTransfers > 0 ? `${pendingTransfers} 项待审批` : '调入 · 调出',
            badge: pendingTransfers,
            onClick: () => navigate('/mobile/transfer'),
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 1l4 4-4 4" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <path d="M7 23l-4-4 4-4" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            ),
          },
        ]
      : []),
    {
      key: 'dashboard',
      label: '打卡看板',
      sub: '考勤统计',
      onClick: () => navigate('/mobile/dashboard'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="18" rx="2" />
          <path d="M6 16l4-5 4 3 4-6" />
        </svg>
      ),
    },
    {
      key: 'tasks',
      label: '任务管理',
      sub: '待提交 · 待整改',
      onClick: () => navigate('/mobile/tasks'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
    {
      key: 'task-stats',
      label: '任务看板',
      sub: '执行统计',
      onClick: () => navigate('/mobile/tasks'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="18" rx="2" />
          <path d="M6 16l4-5 4 3 4-6" />
        </svg>
      ),
    },
    ...(currentUser.role === '店长'
      ? [
          {
            key: 'recruit',
            label: '门店招聘',
            sub: '提报应聘',
            onClick: () => navigate('/mobile/recruit'),
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            ),
          },
        ]
      : []),
    {
      key: 'handover',
      label: '交接班',
      sub: '交班 · 审核',
      onClick: () => navigate('/mobile/handover'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 1l4 4-4 4" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <path d="M7 23l-4-4 4-4" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      ),
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部头部 */}
      <div
        style={{
          background: 'linear-gradient(145deg, #ff9500 0%, #ff8c00 55%, #e67e00 100%)',
          padding: '14px 16px 32px',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <div style={{ position: 'absolute', top: -36, right: -24, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,.08)' }} />
        <div style={{ position: 'absolute', bottom: -50, left: -16, width: 140, height: 140, borderRadius: '50%', background: 'rgba(0,0,0,.06)' }} />

        {/* 用户信息行 */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '.5px', lineHeight: 1.1 }}>
              {currentUser.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
              <span style={{ background: 'rgba(255,255,255,.28)', borderRadius: 6, padding: '2px 9px', fontSize: 12, fontWeight: 700 }}>
                {currentUser.role}
              </span>
              <span style={{ fontSize: 11, opacity: .65 }}>
                {currentUser.empNo} · {store?.storeName}
              </span>
            </div>
          </div>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 19,
              fontWeight: 900,
              color: '#fff',
              border: '2px solid rgba(255,255,255,.35)',
              flexShrink: 0,
            }}
          >
            {currentUser.name.charAt(0)}
          </div>
        </div>

        {/* 今日简报（4格） */}
        <div style={{ position: 'relative', display: 'flex', gap: 6, marginTop: 12 }}>
          {[
            { label: '今日打卡', value: todayAttendance },
            { label: '待审批', value: pendingTransfers, highlight: '#fde68a' },
            { label: '待完成任务', value: 0 },
            { label: '本月出勤', value: monthAttendance },
          ].map(({ label, value, highlight }) => (
            <div
              key={label}
              style={{ flex: 1, background: 'rgba(255,255,255,.14)', borderRadius: 10, padding: '7px 4px', textAlign: 'center' }}
            >
              <div style={{ fontSize: 17, fontWeight: 800, color: highlight || '#fff' }}>{value}</div>
              <div style={{ fontSize: 9, opacity: .8, marginTop: 1 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 菜单 + 快捷（可滚动） */}
      <div
        style={{
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          marginTop: -16,
          flex: 1,
          overflowY: 'auto',
        }}
      >
        <div style={{ padding: '16px 14px 0' }}>
          {/* 功能菜单标题 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e', letterSpacing: '.2px' }}>功能菜单</span>
            <span style={{ fontSize: 11, color: '#bbb' }}>{menuItems.length} 项功能</span>
          </div>

          {/* 九宫格 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {menuItems.map((item) => (
              <MenuCard key={item.key} item={item} />
            ))}
          </div>

          {/* 今日快捷 */}
          <div style={{ marginTop: 20, paddingBottom: 90 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>今日快捷</div>

            <div
              onClick={() => {
                if (todaySchedule) {
                  navigate(`/mobile/checkin?date=${today}&scheduleId=${todaySchedule.id}`)
                } else {
                  navigate('/mobile/attendance')
                }
              }}
              style={{
                background: '#fff',
                borderRadius: 12,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,.05)',
                marginBottom: 8,
                cursor: 'pointer',
                border: '1.5px solid #fff1f0',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff1f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e6232a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>立即打卡</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>
                  {todaySchedule ? '今日已排班，点击打卡' : '今日暂无排班'}
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <div
              onClick={() => navigate('/mobile/dashboard')}
              style={{
                background: '#fff',
                borderRadius: 12,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,.05)',
                cursor: 'pointer',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff1f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e6232a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="18" rx="2" />
                  <path d="M6 16l4-5 4 3 4-6" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>查看考勤看板</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>本月出勤 {monthAttendance} 天</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
