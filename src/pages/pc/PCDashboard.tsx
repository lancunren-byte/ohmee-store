import React from 'react'
import { Row, Col, Card, Statistic, Typography, List, Tag, Badge } from 'antd'
import {
  ShopOutlined,
  TeamOutlined,
  ScheduleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { useAppStore } from '../../store'
import { getStoreStatusColor, getRoleColor } from '../../utils/helpers'

const { Title, Text } = Typography

export default function PCDashboard() {
  const { schedules, attendances, selectedCompanyId, getScopedStores, getScopedEmployees, getScopedShiftTypes } = useAppStore()
  const companyStores = selectedCompanyId ? getScopedStores(selectedCompanyId) : []
  const companyEmployees = selectedCompanyId ? getScopedEmployees(selectedCompanyId) : []
  const companyShiftTypes = selectedCompanyId ? getScopedShiftTypes(selectedCompanyId) : []

  const activeStores = companyStores.filter((s) => s.isActive && s.status === '营业中')
  const activeEmployees = companyEmployees.filter((e) => e.isActive)
  const companyStoreIds = new Set(companyStores.map((s) => s.id))
  const todayAttendances = attendances.filter(
    (a) =>
      a.date === new Date().toISOString().slice(0, 10) &&
      (!selectedCompanyId || companyStoreIds.has(a.storeId)),
  )

  const storeStatusStats = ['营业中', '建设中', '已闭店', '待搬迁'].map((status) => ({
    status,
    count: companyStores.filter((s) => s.isActive && s.status === status).length,
  }))

  const roleStats = ['督导', '店长', '全职店员', '管培生', '兼职店员'].map((role) => ({
    role,
    count: activeEmployees.filter((e) => e.role === role).length,
  }))

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        系统概览
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>营业门店</span>}
              value={activeStores.length}
              suffix="家"
              valueStyle={{ color: '#fff', fontSize: 28 }}
              prefix={<ShopOutlined style={{ color: 'rgba(255,255,255,0.8)' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>在职员工</span>}
              value={activeEmployees.length}
              suffix="人"
              valueStyle={{ color: '#fff', fontSize: 28 }}
              prefix={<TeamOutlined style={{ color: 'rgba(255,255,255,0.8)' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>班次类型</span>}
              value={companyShiftTypes.filter((s) => s.isActive).length}
              suffix="种"
              valueStyle={{ color: '#fff', fontSize: 28 }}
              prefix={<ScheduleOutlined style={{ color: 'rgba(255,255,255,0.8)' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>今日打卡</span>}
              value={todayAttendances.length}
              suffix="次"
              valueStyle={{ color: '#fff', fontSize: 28 }}
              prefix={<CheckCircleOutlined style={{ color: 'rgba(255,255,255,0.8)' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="门店状态分布" bordered={false}>
            <Row gutter={[8, 8]}>
              {storeStatusStats.map(({ status, count }) => (
                <Col span={12} key={status}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#f5f5f5',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Badge color={getStoreStatusColor(status)} />
                      <Text>{status}</Text>
                    </div>
                    <Text strong style={{ fontSize: 20 }}>
                      {count}
                    </Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="员工角色分布" bordered={false}>
            <List
              size="small"
              dataSource={roleStats}
              renderItem={({ role, count }) => (
                <List.Item
                  extra={
                    <Text strong style={{ fontSize: 16 }}>
                      {count}人
                    </Text>
                  }
                >
                  <Tag color={getRoleColor(role)} style={{ color: '#fff' }}>
                    {role}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="门店列表" bordered={false} size="small">
            <Row gutter={[8, 8]}>
              {companyStores
                .filter((s) => s.isActive)
                .slice(0, 8)
                .map((store) => (
                  <Col xs={24} sm={12} lg={6} key={store.id}>
                    <Card
                      size="small"
                      bordered
                      style={{ borderLeft: `4px solid ${getStoreStatusColor(store.status)}` }}
                    >
                      <div>
                        <Text strong>{store.storeName}</Text>
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {store.storeNo} · {store.type}
                        </Text>
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <Badge color={getStoreStatusColor(store.status)} text={store.status} />
                      </div>
                    </Card>
                  </Col>
                ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
