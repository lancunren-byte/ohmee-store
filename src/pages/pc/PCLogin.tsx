import React, { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'
import { apiLogin, apiFetchData } from '../../api/client'

export default function PCLogin() {
  const navigate = useNavigate()
  const { employees, companies, login, hydrateFromApi } = useAppStore()
  const [loading, setLoading] = useState(false)

  const activeEmployees = employees.filter((e) => e.isActive)

  const handleLogin = async (values: { empNo: string; password: string }) => {
    setLoading(true)
    try {
      const res = await apiLogin(values.empNo.trim(), values.password)
      if (res.success && res.user) {
        try {
          const data = await apiFetchData()
          hydrateFromApi(data)
        } catch {
          // 数据拉取失败时仍可登录
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
        message.success(`欢迎回来，${res.user.name}`)
        navigate('/pc')
        setLoading(false)
        return
      }
    } catch {
      // API 失败，回退到本地
    }
    const emp = activeEmployees.find(
      (e) => e.empNo.toUpperCase() === values.empNo.trim().toUpperCase() && e.password === values.password,
    )
    if (!emp) {
      message.error('工号或密码错误')
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
      message.success(`欢迎回来，${emp.name}`)
      navigate('/pc')
    }
    setLoading(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#e6232a', letterSpacing: 2 }}>Ohmee</div>
          <div style={{ fontSize: 14, color: '#999', marginTop: 4 }}>PC 管理端 · 请登录</div>
        </div>
        <Form
          layout="vertical"
          onFinish={handleLogin}
          initialValues={{ empNo: '', password: '' }}
        >
          <Form.Item
            name="empNo"
            label="工号"
            rules={[{ required: true, message: '请输入工号' }]}
          >
            <Input placeholder="请输入工号" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button style={{ width: '100%', background: '#e6232a', borderColor: '#e6232a' }} type="primary" htmlType="submit" size="large" loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
          演示账号：EMP001 / EMP003 等，密码：123456（本地）/ ohmee2026（生产）
        </div>
      </Card>
    </div>
  )
}
