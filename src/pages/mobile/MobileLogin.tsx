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

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 品牌头部 - Ohmee 横向 Logo */}
      <div
        style={{
          background: 'linear-gradient(145deg, #ff3b30 0%, #e6232a 55%, #a61010 100%)',
          padding: '40px 24px 36px',
          textAlign: 'center',
          color: '#fff',
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: 2,
            marginBottom: 6,
          }}
        >
          Ohmee
        </div>
        <div style={{ fontSize: 14, opacity: 0.9 }}>Ohmee 门店管理系统</div>
      </div>

      {/* 工号+密码表单 */}
      <div style={{ padding: '24px 16px' }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
          <Input
            placeholder="请输入工号"
            value={empNo}
            onChange={setEmpNo}
            style={{ '--font-size': '15px', '--text-align': 'left' }}
            clearable
          />
          <div style={{ height: 12 }} />
          <div style={{ position: 'relative' }}>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="请输入密码"
              value={password}
              onChange={setPassword}
              style={{ '--font-size': '15px', '--text-align': 'left' }}
              clearable
            />
            <div
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 12,
                color: '#999',
                cursor: 'pointer',
              }}
            >
              {showPassword ? '隐藏' : '显示'}
            </div>
          </div>
          <Button
            block
            color="primary"
            size="large"
            style={{
              marginTop: 20,
              borderRadius: 8,
              '--background-color': '#e6232a',
              '--border-radius': '8px',
            }}
            onClick={handleLogin}
            loading={loading}
          >
            登录
          </Button>
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
