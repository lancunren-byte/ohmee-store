import React, { useState } from 'react'
import { List, Button, Toast, Input } from 'antd-mobile'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'
import { Employee } from '../../types'
import { apiLogin, apiFetchData } from '../../api/client'

export default function MobileLogin() {
  const navigate = useNavigate()
  const { employees, stores, companies, login, hydrateFromApi } = useAppStore()
  const [empNo, setEmpNo] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const [loading, setLoading] = useState(false)

  const activeEmployees = employees.filter((e) => e.isActive)

  const handleLogin = async () => {
    if (!empNo.trim()) {
      Toast.show({ content: '请输入工号', icon: 'fail' })
      return
    }
    if (!password) {
      Toast.show({ content: '请输入密码', icon: 'fail' })
      return
    }
    setLoading(true)
    try {
      const res = await apiLogin(empNo.trim(), password)
      if (res.success && res.user) {
        try {
          const data = await apiFetchData()
          hydrateFromApi(data)
        } catch {
          // 数据拉取失败时仍可登录，使用本地数据
        }
        login({
          id: res.user.id,
          empNo: res.user.empNo,
          name: res.user.name,
          role: res.user.role,
          roleId: res.user.roleId,
          storeId: res.user.storeId,
          regionId: res.user.regionId,
          companyId: res.user.companyId,
          countryId: res.user.countryId || '',
          assignedRegionIds: res.user.assignedRegionIds,
          assignedStoreIds: res.user.assignedStoreIds,
        })
        Toast.show({ content: `欢迎回来，${res.user.name}`, icon: 'success' })
        navigate('/mobile/home')
        return
      }
    } catch {
      // API 失败，回退到本地校验
    }
    const emp = activeEmployees.find(
      (e) => e.empNo.toUpperCase() === empNo.trim().toUpperCase() && e.password === password,
    )
    if (!emp) {
      Toast.show({ content: '工号或密码错误', icon: 'fail' })
    } else {
      const company = companies.find((c) => c.id === emp.companyId)
      login({
        id: emp.id,
        empNo: emp.empNo,
        name: emp.name,
        role: emp.role,
        roleId: emp.roleId,
        storeId: emp.storeId,
        regionId: emp.regionId,
        companyId: emp.companyId,
        countryId: company?.countryId || '',
        assignedRegionIds: emp.assignedRegionIds,
        assignedStoreIds: emp.assignedStoreIds,
      })
      Toast.show({ content: `欢迎回来，${emp.name}`, icon: 'success' })
      navigate('/mobile/home')
    }
    setLoading(false)
  }

  const handleDemoSelect = (emp: Employee) => {
    const company = companies.find((c) => c.id === emp.companyId)
    login({
      id: emp.id,
      empNo: emp.empNo,
      name: emp.name,
      role: emp.role,
      roleId: emp.roleId,
      storeId: emp.storeId,
      regionId: emp.regionId,
      companyId: emp.companyId,
      countryId: company?.countryId || '',
      assignedRegionIds: emp.assignedRegionIds,
      assignedStoreIds: emp.assignedStoreIds,
    })
    Toast.show({ content: `欢迎回来，${emp.name}`, icon: 'success' })
    navigate('/mobile/home')
  }

  const roleColorMap: Record<string, string> = {
    督导: '#722ed1',
    稽核专员: '#1677ff',
    店长: '#13c2c2',
    全职店员: '#52c41a',
    管培生: '#fa8c16',
    兼职店员: '#eb2f96',
  }

  const LANGS = [
    { key: 'zh', label: '中' },
    { key: 'en', label: 'EN' },
    { key: 'vi', label: 'VI' },
  ]
  const [activeLang, setActiveLang] = useState(localStorage.getItem('ohmee-lang') || 'zh')

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', flexDirection: 'column' }}>

      {/* 顶部门店背景图区域 */}
      <div style={{ position: 'relative', height: '42vh', minHeight: 220, overflow: 'hidden' }}>
        <img
          src="/images/store-bg.png"
          alt="store"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        {/* 渐变遮罩 */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 60%, rgba(240,242,245,1) 100%)'
        }} />

        {/* 语言切换 */}
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 6 }}>
          {LANGS.map(l => (
            <div
              key={l.key}
              onClick={() => { setActiveLang(l.key); localStorage.setItem('ohmee-lang', l.key) }}
              style={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                cursor: 'pointer',
                background: activeLang === l.key ? '#e6232a' : 'rgba(255,255,255,0.85)',
                color: activeLang === l.key ? '#fff' : '#333',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }}
            >
              {l.label}
            </div>
          ))}
        </div>

        {/* Logo + 标题 */}
        <div style={{
          position: 'absolute', bottom: 24, left: 0, right: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/icons/icon.png" alt="logo" style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', padding: 2 }} />
            <span style={{ fontSize: 28, fontWeight: 800, color: '#e6232a', letterSpacing: 1 }}>Ohmee</span>
          </div>
          <div style={{ fontSize: 15, color: '#555', marginTop: 4, fontWeight: 500 }}>门店管理系统</div>
        </div>
      </div>

      {/* 登录表单卡片 */}
      <div style={{ flex: 1, padding: '0 20px 32px', marginTop: 8 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '24px 20px', boxShadow: '0 4px 20px rgba(0,0,0,.08)' }}>
          {/* 员工工号 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 }}>员工工号</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: '1px solid #e8e8e8', borderRadius: 10, padding: '10px 14px', background: '#fafafa'
            }}>
              <span style={{ color: '#bbb', fontSize: 16 }}>👤</span>
              <Input
                placeholder="请输入工号，如 EMP003"
                value={empNo}
                onChange={setEmpNo}
                style={{ '--font-size': '15px', flex: 1 }}
                clearable
              />
            </div>
          </div>

          {/* 密码 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 }}>密码</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: '1px solid #e8e8e8', borderRadius: 10, padding: '10px 14px', background: '#fafafa'
            }}>
              <span style={{ color: '#bbb', fontSize: 16 }}>🔒</span>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                value={password}
                onChange={setPassword}
                style={{ '--font-size': '15px', flex: 1 }}
                clearable
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{ color: '#bbb', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {showPassword ? '隐藏' : '显示'}
              </span>
            </div>
          </div>

          <Button
            block color="primary" size="large"
            style={{ borderRadius: 10, '--background-color': '#e6232a', '--border-radius': '10px', height: 48, fontSize: 17, fontWeight: 700 }}
            onClick={handleLogin}
            loading={loading}
          >
            登录
          </Button>
          <div style={{ textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: 14 }}>
            初始密码为 ohmee2026，首次登录后需修改
          </div>
        </div>

        <div
          onClick={() => setShowDemo(!showDemo)}
          style={{
            marginTop: 16,
            fontSize: 13,
            color: '#999',
            textAlign: 'center',
          }}
        >
          {showDemo ? '收起演示模式' : '演示模式：快速选择账号'}
        </div>

        {showDemo && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>演示账号密码：123456（本地）/ ohmee2026（生产）</div>
            <List style={{ borderRadius: 12, overflow: 'hidden' }}>
              {activeEmployees.map((emp) => {
                const store = stores.find((s) => s.id === emp.storeId)
                return (
                  <List.Item
                    key={emp.id}
                    prefix={
                      <div
                        style={{
                          background: roleColorMap[emp.role] || '#e6232a',
                          color: '#fff',
                          fontSize: 12,
                          width: 36,
                          height: 36,
                          lineHeight: '36px',
                          textAlign: 'center',
                          borderRadius: '50%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {emp.name.slice(-2)}
                      </div>
                    }
                    description={
                      <span style={{ fontSize: 11 }}>
                        <span
                          style={{
                            background: roleColorMap[emp.role] || '#e6232a',
                            color: '#fff',
                            padding: '1px 5px',
                            borderRadius: 4,
                            marginRight: 4,
                            fontSize: 10,
                          }}
                        >
                          {emp.role}
                        </span>
                        {store?.storeName || '-'}
                      </span>
                    }
                    onClick={() => handleDemoSelect(emp)}
                  >
                    <span style={{ fontWeight: 600 }}>{emp.name}</span>
                    <span style={{ color: '#999', fontSize: 12, marginLeft: 6 }}>{emp.empNo}</span>
                  </List.Item>
                )
              })}
            </List>
          </div>
        )}
      </div>
    </div>
  )
}
