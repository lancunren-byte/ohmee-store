import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'
import { Empty, Toast } from 'antd-mobile'

export default function MobileTasks() {
  const navigate = useNavigate()
  const { currentUser } = useAppStore()

  if (!currentUser) {
    navigate('/mobile/login')
    return null
  }

  const items = [
    {
      key: 'task-list',
      title: '任务管理',
      description: '待提交 · 待整改 · 已完成',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
    {
      key: 'task-stats',
      title: '任务看板',
      description: '执行统计 · 质量分析',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="18" rx="2" />
          <path d="M6 16l4-5 4 3 4-6" />
        </svg>
      ),
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', paddingBottom: 80 }}>
      <div
        style={{
          background: 'linear-gradient(145deg, #ff3b30 0%, #e6232a 55%, #a61010 100%)',
          padding: '20px 16px 28px',
          color: '#fff',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700 }}>任务管理</div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>查看与处理门店任务</div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {items.map((item) => (
            <div
              key={item.key}
              onClick={() => Toast.show({ content: '任务管理功能开发中，敬请期待' })}
              style={{
                background: 'linear-gradient(145deg, #bf8484 0%, #b66d6f 55%, #ae606c 100%)',
                borderRadius: 14,
                padding: 20,
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 5px 0 #9e6666, 0 6px 18px rgba(182,109,111,.38)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div style={{ color: '#fff' }}>{item.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{item.title}</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>{item.description}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24, padding: 24, textAlign: 'center', background: '#fff', borderRadius: 12 }}>
          <Empty description="任务管理功能开发中，敬请期待" />
        </div>
      </div>
    </div>
  )
}
