import React, { useEffect, useMemo, useState } from 'react'
import { Layout, Menu, Typography, Avatar, Dropdown, Select, theme } from 'antd'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAppStore } from '../../store'
import { usePermission } from '../../hooks/usePermission'
import {
  ShopOutlined,
  TeamOutlined,
  ScheduleOutlined,
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  AppstoreOutlined,
  SwapOutlined,
  SafetyOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout
const { Text } = Typography

const allMenuItems = [
  {
    key: '/pc',
    icon: <DashboardOutlined />,
    label: '系统概览',
    menuKeys: ['/pc'] as const,
  },
  {
    key: 'store-group',
    icon: <ShopOutlined />,
    label: '门店管理',
    children: [
      { key: '/pc/stores', label: '门店列表', menuKeys: ['/pc/stores'] as const },
      { key: '/pc/regions', label: '区域管理', menuKeys: ['/pc/regions'] as const },
    ],
    menuKeys: ['/pc/stores', '/pc/regions'] as const,
  },
  {
    key: '/pc/employees',
    icon: <TeamOutlined />,
    label: '员工管理',
    menuKeys: ['/pc/employees'] as const,
  },
  {
    key: 'attendance-group',
    icon: <ScheduleOutlined />,
    label: '考勤管理',
    children: [
      { key: '/pc/shift-types', label: '班次类型配置', menuKeys: ['/pc/shift-types'] as const },
      { key: '/pc/shifts', label: '班次清单', menuKeys: ['/pc/shifts'] as const },
      { key: '/pc/schedules', label: '排班清单', menuKeys: ['/pc/schedules'] as const },
      { key: '/pc/work-hours', label: '工时统计', menuKeys: ['/pc/work-hours'] as const },
      { key: '/pc/attendance-export', label: '打卡数据导出', menuKeys: ['/pc/attendance-export'] as const },
    ],
    menuKeys: ['/pc/shift-types', '/pc/shifts', '/pc/schedules', '/pc/work-hours', '/pc/attendance-export'] as const,
  },
  {
    key: 'handover-group',
    icon: <SwapOutlined />,
    label: '交接班管理',
    children: [
      { key: '/pc/handover', label: '门店交接班查询', menuKeys: ['/pc/handover'] as const },
    ],
    menuKeys: ['/pc/handover'] as const,
  },
  {
    key: 'task-group',
    icon: <CheckSquareOutlined />,
    label: '门店任务管理',
    children: [
      { key: '/pc/tasks', label: '任务配置', menuKeys: ['/pc/tasks'] as const },
      { key: '/pc/task-stats', label: '任务执行统计', menuKeys: ['/pc/task-stats'] as const },
      { key: '/pc/task-dispatch', label: '任务下发记录', menuKeys: ['/pc/task-dispatch'] as const },
    ],
    menuKeys: ['/pc/tasks', '/pc/task-stats', '/pc/task-dispatch'] as const,
  },
  {
    key: '/pc/recruit',
    icon: <TeamOutlined />,
    label: '人员招聘统计',
    menuKeys: ['/pc/recruit'] as const,
  },
  {
    key: '/pc/permissions',
    icon: <SafetyOutlined />,
    label: '权限管理',
    menuKeys: ['/pc/permissions'] as const,
  },
]

export default function PCLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = theme.useToken()
  const { can } = usePermission()
  const {
    countries,
    companies,
    currentUser,
    selectedCountryId,
    selectedCompanyId,
    setSelectedCountry,
    setSelectedCompany,
    logout,
  } = useAppStore()

  const filteredCompanies = selectedCountryId
    ? companies.filter((c) => c.countryId === selectedCountryId && c.isActive)
    : companies.filter((c) => c.isActive)

  const selectableCompanies = useMemo(() => {
    if (!currentUser) return filteredCompanies
    if (currentUser.role === '稽核专员') return filteredCompanies
    return filteredCompanies.filter((c) => c.id === currentUser.companyId)
  }, [filteredCompanies, currentUser])

  const selectableCountries = useMemo(() => {
    if (!currentUser) return countries.filter((c) => c.isActive)
    const userCountryId = currentUser.countryId || companies.find((c) => c.id === currentUser.companyId)?.countryId
    if (!userCountryId) return countries.filter((c) => c.isActive)
    return countries.filter((c) => c.isActive && c.id === userCountryId)
  }, [countries, companies, currentUser])

  const menuItems = useMemo(() => {
    return allMenuItems
      .map((item) => {
        if (item.children) {
          const filteredChildren = item.children.filter((child) =>
            child.menuKeys.some((k) => can.menu(k)),
          )
          if (filteredChildren.length === 0) return null
          return {
            ...item,
            children: filteredChildren.map(({ key, label }) => ({ key, label })),
          }
        }
        if (!item.menuKeys.some((k) => can.menu(k))) return null
        return { key: item.key, icon: item.icon, label: item.label }
      })
      .filter(Boolean) as typeof allMenuItems
  }, [can])

  const selectedKey = location.pathname

  useEffect(() => {
    const path = location.pathname
    if (path === '/pc' || path === '/pc/') return
    const menuKey = path as import('../../config/permissions').PCMenuKey
    if (!can.menu(menuKey)) navigate('/pc', { replace: true })
  }, [location.pathname, can, navigate])

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        style={{
          background: '#001529',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          overflow: 'auto',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 16px',
            background: 'rgba(255,255,255,0.05)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            gap: 8,
          }}
        >
          <AppstoreOutlined style={{ color: '#1677ff', fontSize: 24 }} />
          {!collapsed && (
            <Text strong style={{ color: '#fff', fontSize: 16, whiteSpace: 'nowrap' }}>
              Ohmee 排班系统
            </Text>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={['store-group', 'attendance-group', 'handover-group', 'task-group']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: token.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            position: 'sticky',
            top: 0,
            zIndex: 99,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <div
            style={{ cursor: 'pointer', fontSize: 18, color: token.colorText }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Select
              placeholder="选择国家"
              value={selectedCountryId || undefined}
              onChange={setSelectedCountry}
              style={{ width: 100 }}
              options={selectableCountries.map((c) => ({ label: c.name, value: c.id }))}
            />
            <Select
              placeholder="选择公司"
              value={selectedCompanyId || undefined}
              onChange={setSelectedCompany}
              style={{ width: 140 }}
              options={selectableCompanies.map((c) => ({ label: c.companyName, value: c.id }))}
            />
            <Text type="secondary" style={{ fontSize: 13 }}>
              欢迎回来，{currentUser?.name || '管理员'}
            </Text>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: ({ key }) => {
                  if (key === 'logout') {
                    logout()
                    navigate('/pc/login')
                  }
                },
              }}
              placement="bottomRight"
            >
              <Avatar
                style={{ backgroundColor: '#1677ff', cursor: 'pointer' }}
                icon={<UserOutlined />}
              />
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            margin: 24,
            padding: 24,
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
            minHeight: 'calc(100vh - 112px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
