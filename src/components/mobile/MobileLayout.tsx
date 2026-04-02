import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { TabBar } from 'antd-mobile'
import {
  AppOutline,
  CalendarOutline,
  FileOutline,
  UserOutline,
} from 'antd-mobile-icons'
import { useAppStore } from '../../store'

const HomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const TaskIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
)

const tabs = [
  { key: '/mobile/home', title: '首页', icon: <HomeIcon /> },
  { key: '/mobile/attendance', title: '打卡', icon: <CalendarOutline /> },
  { key: '/mobile/tasks', title: '任务', icon: <TaskIcon /> },
  { key: '/mobile/profile', title: '我的', icon: <UserOutline /> },
]

export default function MobileLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser } = useAppStore()

  const activeKey =
    tabs.find((t) => location.pathname.startsWith(t.key))?.key || '/mobile/home'

  const handleTabChange = (key: string) => {
    navigate(key)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#f5f5f5',
      }}
    >
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </div>
      <TabBar
        activeKey={activeKey}
        onChange={handleTabChange}
      >
        {tabs.map((item) => (
          <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
        ))}
      </TabBar>
    </div>
  )
}
