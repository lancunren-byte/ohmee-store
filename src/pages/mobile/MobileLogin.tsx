import React, { useState } from 'react'
import { Button, Toast, Input } from 'antd-mobile'
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
  const [lang, setLang] = useState(localStorage.getItem('ohmee-lang') === 'en' ? 'EN' : localStorage.getItem('ohmee-lang') === 'vi' ? 'VI' : '中')

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

  const LANGS = ['中', 'EN', 'VI']

  const handleLangSwitch = (l: string) => {
    setLang(l)
    localStorage.setItem('ohmee-lang', l === 'EN' ? 'en' : l === 'VI' ? 'vi' : 'zh')
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* 背景图 */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/store-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        zIndex: 0,
      }} />
      {/* 渐变遮罩 - 底部白色 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.85) 65%, #fff 80%)',
        zIndex: 1,
      }} />

      {/* 语言切换 - 右上角 */}
      <div style={{ position: 'absolute', top: 20, right: 16, zIndex: 10, display: 'flex', gap: 4 }}>
        {LANGS.map(l => (
          <div
            key={l}
            onClick={() => handleLangSwitch(l)}
            style={{
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              background: lang === l ? '#e6232a' : 'rgba(255,255,255,0.85)',
              color: lang === l ? '#fff' : '#333',
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            }}
          >
            {l}
          </div>
        ))}
      </div>

      {/* Logo 区域 */}
      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/icons/icon.png" alt="Ohmee" style={{ width: 52, height: 52, borderRadius: 12 }} />
          <span style={{ fontSize: 32, fontWeight: 800, color: '#e6232a', letterSpacing: 1 }}>Ohmee</span>
        </div>
        <div style={{ fontSize: 16, color: '#333', marginTop: 8, fontWeight: 500 }}>门店管理系统</div>
      </div>

      {/* 登录表单卡片 */}
      <div style={{ position: 'relative', zIndex: 2, padding: '0 20px 40px' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '24px 20px', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
          {/* 工号 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 }}>员工工号</div>
            <div style={{ border: '1px solid #eee', borderRadius: 10, padding: '10px 14px', background: '#fafafa', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#bbb', fontSize: 16 }}>👤</span>
              <Input
                placeholder="请输入工号，如 EMP003"
                value={empNo}
                onChange={setEmpNo}
                style={{ '--font-size': '15px', '--text-align': 'left', flex: 1 }}
              />
            </div>
          </div>
          {/* 密码 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 }}>密码</div>
            <div style={{ border: '1px solid #eee', borderRadius: 10, padding: '10px 14px', background: '#fafafa', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#bbb', fontSize: 16 }}>🔒</span>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                value={password}
                onChange={setPassword}
                style={{ '--font-size': '15px', '--text-align': 'left', flex: 1 }}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{ color: '#bbb', fontSize: 18, cursor: 'pointer' }}
              >
                {showPassword ? '🙈' : '👁'}
              </span>
            </div>
          </div>

          <Button
            block
            color="primary"
            size="large"
            style={{ borderRadius: 10, '--background-color': '#e6232a', '--border-radius': '10px', fontWeight: 700, fontSize: 16 }}
            onClick={handleLogin}
            loading={loading}
          >
            登录
          </Button>

          <div style={{ marginTop: 12, fontSize: 12, color: '#aaa', textAlign: 'center' }}>
            初始密码为 ohmee2026，首次登录后需修改
          </div>
        </div>

        {/* 演示模式 */}
        <div
          onClick={() => setShowDemo(!showDemo)}
          style={{ marginTop: 16, fontSize: 13, color: '#888', textAlign: 'center' }}
        >
          {showDemo ? '收起演示模式 ▲' : '演示模式：快速选择账号 ▼'}
        </div>

        {showDemo && (
          <div style={{ marginTop: 10, background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
            {activeEmployees.map((emp) => {
              const store = stores.find((s) => s.id === emp.storeId)
              return (
                <div
                  key={emp.id}
                  onClick={() => handleDemoSelect(emp)}
                  style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <div style={{ background: roleColorMap[emp.role] || '#e6232a', color: '#fff', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                    {emp.name.slice(-2)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{emp.name} <span style={{ fontSize: 12, color: '#999' }}>{emp.empNo}</span></div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                      <span style={{ background: roleColorMap[emp.role] || '#e6232a', color: '#fff', padding: '1px 5px', borderRadius: 4, marginRight: 4 }}>{emp.role}</span>
                      {store?.storeName || '-'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
