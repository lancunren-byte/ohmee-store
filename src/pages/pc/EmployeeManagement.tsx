import React, { useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  Popconfirm,
  Typography,
  Row,
  Col,
  DatePicker,
  InputNumber,
  message,
  Avatar,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  StopOutlined,
  SearchOutlined,
  UserOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useAppStore } from '../../store'
import { usePermission } from '../../hooks/usePermission'
import { Employee, EmployeeRole, Gender } from '../../types'
import { getRoleColor } from '../../utils/helpers'
import { isApiMode, apiCreateEmployee, apiUpdateEmployee, apiDeactivateEmployee } from '../../api/client'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const roleOptions: EmployeeRole[] = ['督导', '稽核专员', '店长', '全职店员', '管培生', '兼职店员']
const genderOptions: Gender[] = ['男', '女']

export default function EmployeeManagement() {
  const { addEmployee, addEmployeeFromApi, updateEmployee, deactivateEmployee, selectedCompanyId, getScopedEmployees, getScopedStores, getScopedRegions } =
    useAppStore()
  const { can } = usePermission()
  const companyEmployees = selectedCompanyId ? getScopedEmployees(selectedCompanyId) : []
  const companyStores = selectedCompanyId ? getScopedStores(selectedCompanyId) : []
  const companyRegions = selectedCompanyId ? getScopedRegions(selectedCompanyId) : []
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [searchText, setSearchText] = useState('')
  const [filterRole, setFilterRole] = useState<EmployeeRole | ''>('')
  const [filterStore, setFilterStore] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [appliedRole, setAppliedRole] = useState<EmployeeRole | ''>('')
  const [appliedStore, setAppliedStore] = useState('')
  const [form] = Form.useForm()

  const activeEmployees = companyEmployees.filter((e) => e.isActive)

  const handleQuery = () => {
    setAppliedSearch(searchText)
    setAppliedRole(filterRole)
    setAppliedStore(filterStore)
  }
  const handleReset = () => {
    setSearchText('')
    setFilterRole('')
    setFilterStore('')
    setAppliedSearch('')
    setAppliedRole('')
    setAppliedStore('')
  }

  const filteredEmployees = activeEmployees.filter((e) => {
    const matchSearch =
      appliedSearch === '' ||
      e.name.includes(appliedSearch) ||
      e.empNo.includes(appliedSearch)
    const matchRole = appliedRole === '' || e.role === appliedRole
    const matchStore = appliedStore === '' || e.storeId === appliedStore
    return matchSearch && matchRole && matchStore
  })

  const canAdd = can.button('employee:add')
  const canEdit = can.button('employee:edit')
  const canDelete = can.button('employee:delete')

  const handleOpenAdd = () => {
    setEditingEmployee(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp)
    form.setFieldsValue({
      ...emp,
      joinDate: dayjs(emp.joinDate),
    })
    setIsModalOpen(true)
  }

  const handleDeactivate = async (id: string) => {
    try {
      if (isApiMode()) await apiDeactivateEmployee(id)
      deactivateEmployee(id)
      message.success('员工已离职处理')
    } catch (e) {
      message.error(e instanceof Error ? e.message : '离职处理失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const empData = {
        ...values,
        joinDate: values.joinDate?.format?.('YYYY-MM-DD') ?? values.joinDate,
      }
      if (editingEmployee) {
        if (isApiMode()) await apiUpdateEmployee(editingEmployee.id, empData)
        updateEmployee(editingEmployee.id, empData)
        message.success('员工信息已更新')
      } else {
        const empNo = `EMP${String(companyEmployees.length + 1).padStart(3, '0')}`
        const payload = {
          ...empData,
          empNo,
          companyId: selectedCompanyId || '',
          isActive: true,
          password: '123456',
        }
        if (isApiMode()) {
          const created = await apiCreateEmployee(payload)
          addEmployeeFromApi(created)
        } else {
          addEmployee(payload)
        }
        message.success('员工创建成功，初始密码：123456')
      }
      setIsModalOpen(false)
    } catch (e) {
      if (e instanceof Error) message.error(e.message)
    }
  }

  const columns = [
    {
      title: '工号',
      dataIndex: 'empNo',
      key: 'empNo',
      width: 100,
      render: (v: string) => <Text code>{v}</Text>,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      render: (v: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          {v}
        </Space>
      ),
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 70,
      render: (v: string) => (
        <Tag color={v === '男' ? 'blue' : 'pink'}>{v}</Tag>
      ),
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 70,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 110,
      render: (v: string) => (
        <Tag color={getRoleColor(v)} style={{ color: '#fff' }}>
          {v}
        </Tag>
      ),
    },
    {
      title: '入职日期',
      dataIndex: 'joinDate',
      key: 'joinDate',
      width: 110,
    },
    {
      title: '所属门店',
      dataIndex: 'storeId',
      key: 'storeId',
      render: (v: string) => companyStores.find((s: { id: string }) => s.id === v)?.storeName || '-',
    },
    {
      title: '所属区域',
      dataIndex: 'regionId',
      key: 'regionId',
      width: 100,
      render: (v: string) => companyRegions.find((r: { id: string }) => r.id === v)?.name || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 130,
      render: (_: unknown, record: Employee) => (
        <Space>
          {canEdit && (
            <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}
          {canDelete && (
            <Popconfirm
              title="确认离职处理？"
              description="处理后该员工将无法登录系统。"
              onConfirm={() => handleDeactivate(record.id)}
              okText="确认"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button type="link" danger icon={<StopOutlined />} size="small">
                离职
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  const roleStats = roleOptions.map((r) => ({
    role: r,
    count: activeEmployees.filter((e) => e.role === r).length,
  }))

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            员工管理
          </Title>
          <Text type="secondary">在职员工 {activeEmployees.length} 人</Text>
        </Col>
        <Col>
          <Space>
            <Input
              placeholder="搜索姓名/工号"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 180 }}
              allowClear
            />
            <Select
              placeholder="角色筛选"
              value={filterRole || undefined}
              onChange={(v) => setFilterRole(v || '')}
              style={{ width: 130 }}
              allowClear
            >
              {roleOptions.map((r) => (
                <Select.Option key={r} value={r}>
                  {r}
                </Select.Option>
              ))}
            </Select>
            <Select
              placeholder="门店筛选"
              value={filterStore || undefined}
              onChange={(v) => setFilterStore(v || '')}
              style={{ width: 160 }}
              allowClear
            >
              {companyStores.filter((s) => s.isActive).map((s) => (
                <Select.Option key={s.id} value={s.id}>
                  {s.storeName}
                </Select.Option>
              ))}
            </Select>
            <Button icon={<SearchOutlined />} onClick={handleQuery}>
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
            {canAdd && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd}>
                新增员工
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      <Row gutter={12} style={{ marginBottom: 20 }}>
        {roleStats.map(({ role, count }) => (
          <Col key={role}>
            <Tag
              color={getRoleColor(role)}
              style={{ padding: '4px 12px', fontSize: 13, color: '#fff' }}
            >
              {role}: {count}人
            </Tag>
          </Col>
        ))}
      </Row>

      <Table
        columns={columns}
        dataSource={filteredEmployees}
        rowKey="id"
        size="middle"
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={editingEmployee ? '编辑员工' : '新增员工'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        width={640}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gender"
                label="性别"
                rules={[{ required: true, message: '请选择性别' }]}
              >
                <Select placeholder="请选择性别">
                  {genderOptions.map((g) => (
                    <Select.Option key={g} value={g}>
                      {g}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="age"
                label="年龄"
                rules={[{ required: true, message: '请输入年龄' }]}
              >
                <InputNumber min={16} max={65} style={{ width: '100%' }} placeholder="请输入年龄" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="role"
                label="角色"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select placeholder="请选择角色">
                  {roleOptions.map((r) => (
                    <Select.Option key={r} value={r}>
                      <Tag color={getRoleColor(r)} style={{ color: '#fff', margin: 0 }}>
                        {r}
                      </Tag>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="joinDate"
                label="入职日期"
                rules={[{ required: true, message: '请选择入职日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择入职日期" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="storeId"
                label="所属门店"
                rules={[{ required: true, message: '请选择所属门店' }]}
              >
                <Select placeholder="请选择所属门店">
                  {companyStores
                    .filter((s) => s.isActive)
                    .map((s) => (
                      <Select.Option key={s.id} value={s.id}>
                        {s.storeName}
                      </Select.Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="regionId"
            label="所属区域"
            rules={[{ required: true, message: '请选择所属区域' }]}
          >
            <Select placeholder="请选择所属区域">
              {companyRegions.map((r) => (
                <Select.Option key={r.id} value={r.id}>
                  {r.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
