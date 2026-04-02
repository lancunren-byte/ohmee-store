import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'
import { usePermission } from '../../hooks/usePermission'
import { NavBar, Empty, Toast } from 'antd-mobile'

export default function MobileRecruit() {
  const navigate = useNavigate()
  const { currentUser } = useAppStore()

  if (!currentUser) {
    navigate('/mobile/login')
    return null
  }

  const { can } = usePermission()
  if (!can.button('mobile:recruit')) {
    Toast.show({ content: '仅店长可访问门店招聘', icon: 'fail' })
    navigate('/mobile/home')
    return null
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', paddingBottom: 80 }}>
      <NavBar onBack={() => navigate('/mobile/home')} style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' } as React.CSSProperties}>
        门店招聘
      </NavBar>
      <div style={{ padding: 24, background: '#fff', margin: 16, borderRadius: 12 }}>
        <Empty description="门店招聘功能开发中，敬请期待" />
      </div>
    </div>
  )
}
