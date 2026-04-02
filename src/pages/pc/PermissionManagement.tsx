import React, { useState } from 'react'
import {
  Card,
  Table,
  Tabs,
  Tag,
  Typography,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Checkbox,
  Popconfirm,
  Row,
  Col,
  message,
} from 'antd'
import {
  GlobalOutlined,
  BankOutlined,
  SafetyOutlined,
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useAppStore } from '../../store'
import {
  ALL_PC_MENU_KEYS,
  ALL_BUTTON_CODES,
  type DataScope,
} from '../../config/permissions'
import type { Country, Company, Role, Employee } from '../../types'
import {
  isApiMode,
  apiCreateCountry,
  apiUpdateCountry,
  apiDeactivateCountry,
  apiCreateCompany,
  apiUpdateCompany,
  apiDeactivateCompany,
  apiCreateRole,
  apiUpdateRole,
  apiDeactivateRole,
  apiCreateEmployee,
  apiUpdateEmployee,
  apiDeactivateEmployee,
} from '../../api/client'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const DATA_SCOPE_OPTIONS: { value: DataScope; label: string }[] = [
  { value: 'country', label: '国家' },
  { value: 'company', label: '公司' },
  { value: 'region', label: '区域（所辖门店）' },
  { value: 'store', label: '门店' },
  { value: 'self', label: '本人' },
]

const MENU_LABELS: Record<string, string> = {
  '/pc': '系统概览',
  '/pc/stores': '门店列表',
  '/pc/regions': '区域管理',
  '/pc/employees': '员工管理',
  '/pc/shift-types': '班次类型配置',
  '/pc/handover': '门店交接班查询',
  '/pc/permissions': '权限管理',
}

const BUTTON_LABELS: Record<string, string> = {
  'region:add': '区域新增',
  'region:edit': '区域编辑',
  'region:delete': '区域删除',
  'store:add': '门店新增',
  'store:edit': '门店编辑',
  'store:delete': '门店作废',
  'employee:add': '员工新增',
  'employee:edit': '员工编辑',
  'employee:delete': '员工离职',
  'shiftType:add': '班次类型新增',
  'shiftType:edit': '班次类型编辑',
  'shiftType:delete': '班次类型停用',
  'handover:view': '交接班查看',
  'handover:export': '交接班导出',
  'mobile:createShift': '创建班次',
  'mobile:scheduling': '人员排班',
  'mobile:transfer': '发起借调',
  'mobile:approveTransfer': '审批借调',
  'mobile:handover': '新增交接班',
  'mobile:approveHandover': '审核交接班',
  'mobile:recruit': '门店招聘',
  'mobile:storeSwitch': '门店切换',
}

export default function PermissionManagement() {
  const [activeTab, setActiveTab] = useState('country')
  const [countryModal, setCountryModal] = useState<{ open: boolean; editing?: Country }>({ open: false })
  const [companyModal, setCompanyModal] = useState<{ open: boolean; editing?: Company }>({ open: false })
  const [roleModal, setRoleModal] = useState<{ open: boolean; editing?: Role }>({ open: false })
  const [userModal, setUserModal] = useState<{ open: boolean; editing?: Employee }>({ open: false })
  const [countrySearch, setCountrySearch] = useState('')
  const [appliedCountrySearch, setAppliedCountrySearch] = useState('')
  const [companySearch, setCompanySearch] = useState('')
  const [appliedCompanySearch, setAppliedCompanySearch] = useState('')
  const [roleSearch, setRoleSearch] = useState('')
  const [appliedRoleSearch, setAppliedRoleSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [appliedUserSearch, setAppliedUserSearch] = useState('')
  const [countryForm] = Form.useForm()
  const [companyForm] = Form.useForm()
  const [roleForm] = Form.useForm()
  const [userForm] = Form.useForm()

  const {
    countries,
    companies,
    roles,
    regions,
    stores,
    employees,
    selectedCompanyId,
    addCountry,
    addCountryFromApi,
    updateCountry,
    deactivateCountry,
    addCompany,
    addCompanyFromApi,
    updateCompany,
    deactivateCompany,
    addRole,
    addRoleFromApi,
    updateRole,
    deactivateRole,
    addEmployee,
    addEmployeeFromApi,
    updateEmployee,
    deactivateEmployee,
    getRolesByCompany,
  } = useAppStore()

  const activeCountries = countries.filter((c) => c.isActive)
  const activeCompanies = companies.filter((c) => c.isActive)
  const companyRoles = selectedCompanyId ? getRolesByCompany(selectedCompanyId) : []
  const companyRegions = selectedCompanyId ? regions.filter((r) => r.companyId === selectedCompanyId) : []
  const companyStores = selectedCompanyId ? stores.filter((s) => s.companyId === selectedCompanyId && s.isActive) : []
  const companyEmployees = selectedCompanyId ? employees.filter((e) => e.companyId === selectedCompanyId && e.isActive) : []

  const filteredCountries = activeCountries.filter(
    (c) => appliedCountrySearch === '' || c.name.toLowerCase().includes(appliedCountrySearch.toLowerCase()) || c.code.toLowerCase().includes(appliedCountrySearch.toLowerCase()),
  )
  const filteredCompanies = activeCompanies.filter(
    (c) => appliedCompanySearch === '' || c.companyName.toLowerCase().includes(appliedCompanySearch.toLowerCase()) || (c.companyNo || '').toLowerCase().includes(appliedCompanySearch.toLowerCase()),
  )
  const filteredRoles = companyRoles.filter(
    (r) => appliedRoleSearch === '' || r.name.toLowerCase().includes(appliedRoleSearch.toLowerCase()),
  )
  const filteredEmployees = companyEmployees.filter(
    (e) => appliedUserSearch === '' || e.name.toLowerCase().includes(appliedUserSearch.toLowerCase()) || (e.empNo || '').toLowerCase().includes(appliedUserSearch.toLowerCase()),
  )

  const handleCountrySubmit = async () => {
    try {
      const v = await countryForm.validateFields()
      if (countryModal.editing) {
        if (isApiMode()) await apiUpdateCountry(countryModal.editing.id, v)
        updateCountry(countryModal.editing.id, v)
        message.success('国家已更新')
      } else {
        const payload = { ...v, isActive: true }
        if (isApiMode()) {
          const created = await apiCreateCountry(v)
          addCountryFromApi(created)
        } else {
          addCountry(payload)
        }
        message.success('国家已创建')
      }
      setCountryModal({ open: false })
      countryForm.resetFields()
    } catch (e) {
      if (e instanceof Error) message.error(e.message)
    }
  }

  const handleCompanySubmit = async () => {
    try {
      const v = await companyForm.validateFields()
      const companyNo = v.companyNo || `C${String(companies.length + 1).padStart(2, '0')}`
      if (companyModal.editing) {
        if (isApiMode()) await apiUpdateCompany(companyModal.editing.id, v)
        updateCompany(companyModal.editing.id, v)
        message.success('公司已更新')
      } else {
        const payload = { ...v, isActive: true, companyNo }
        if (isApiMode()) {
          const created = await apiCreateCompany({ ...v, companyNo })
          addCompanyFromApi(created)
        } else {
          addCompany(payload)
        }
        message.success('公司已创建')
      }
      setCompanyModal({ open: false })
      companyForm.resetFields()
    } catch (e) {
      if (e instanceof Error) message.error(e.message)
    }
  }

  const handleRoleSubmit = async () => {
    try {
      const v = await roleForm.validateFields()
      const menuKeys = (v.menuKeys as string[]) || []
      const buttonCodes = (v.buttonCodes as string[]) || []
      if (roleModal.editing) {
        if (isApiMode()) await apiUpdateRole(roleModal.editing.id, { ...v, menuKeys, buttonCodes })
        updateRole(roleModal.editing.id, { ...v, menuKeys, buttonCodes })
        message.success('角色已更新')
      } else {
        const payload = { ...v, companyId: selectedCompanyId || '', menuKeys, buttonCodes, isActive: true }
        if (isApiMode()) {
          const created = await apiCreateRole(payload)
          addRoleFromApi(created)
        } else {
          addRole(payload)
        }
        message.success('角色已创建')
      }
      setRoleModal({ open: false })
      roleForm.resetFields()
    } catch (e) {
      if (e instanceof Error) message.error(e.message)
    }
  }

  const handleUserSubmit = async () => {
    try {
      const v = await userForm.validateFields()
      if (userModal.editing) {
        const payload = { roleId: v.roleId || undefined, assignedRegionIds: v.assignedRegionIds || [], assignedStoreIds: v.assignedStoreIds || [] }
        if (isApiMode()) await apiUpdateEmployee(userModal.editing.id, payload)
        updateEmployee(userModal.editing.id, payload)
        message.success('用户已更新')
      } else {
        const empNo = v.empNo || `EMP${String(employees.length + 1).padStart(3, '0')}`
        const roleName = v.roleId ? companyRoles.find((r) => r.id === v.roleId)?.name ?? '' : ''
        const roleMap: Record<string, import('../../types').EmployeeRole> = {
          督导: '督导',
          稽核专员: '稽核专员',
          店长: '店长',
          全职店员: '全职店员',
          管培生: '管培生',
          兼职店员: '兼职店员',
        }
        const payload = {
          empNo,
          name: v.name,
          gender: v.gender,
          age: Number(v.age),
          role: (roleName && roleMap[roleName]) || '全职店员',
          joinDate: typeof v.joinDate === 'string' ? v.joinDate : v.joinDate?.format?.('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
          storeId: v.storeId,
          regionId: v.regionId,
          companyId: selectedCompanyId || '',
          roleId: v.roleId || undefined,
          assignedRegionIds: v.assignedRegionIds || [],
          assignedStoreIds: v.assignedStoreIds || [],
          isActive: true,
          password: '123456',
        }
        if (isApiMode()) {
          const created = await apiCreateEmployee(payload)
          addEmployeeFromApi(created)
        } else {
          addEmployee(payload)
        }
        message.success('用户已创建，初始密码：123456')
      }
      setUserModal({ open: false })
      userForm.resetFields()
    } catch (e) {
      if (e instanceof Error) message.error(e.message)
    }
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 8 }}>
        权限管理
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        管理国家、公司、角色与用户；角色可配置菜单和按钮权限；用户分配角色、区域和门店，未分配门店时默认该区域下所有门店。
      </Text>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'country',
            label: (
              <span>
                <GlobalOutlined />
                国家管理
              </span>
            ),
            children: (
              <Card
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => { setCountryModal({ open: true }); countryForm.resetFields() }}>
                    新建国家
                  </Button>
                }
              >
                <Space wrap style={{ marginBottom: 16 }}>
                  <Input
                    placeholder="搜索国家名称/代码"
                    prefix={<SearchOutlined />}
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    onPressEnter={() => setAppliedCountrySearch(countrySearch)}
                    style={{ width: 200 }}
                    allowClear
                  />
                  <Button icon={<SearchOutlined />} onClick={() => setAppliedCountrySearch(countrySearch)}>查询</Button>
                  <Button icon={<ReloadOutlined />} onClick={() => { setCountrySearch(''); setAppliedCountrySearch('') }}>重置</Button>
                </Space>
                <Table
                  dataSource={filteredCountries}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: '国家代码', dataIndex: 'code', width: 100, render: (v) => <Text code>{v}</Text> },
                    { title: '国家名称', dataIndex: 'name' },
                    { title: '创建时间', dataIndex: 'createdAt', width: 120 },
                    {
                      title: '操作',
                      width: 120,
                      render: (_, r) => (
                        <Space>
                          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setCountryModal({ open: true, editing: r }); countryForm.setFieldsValue(r) }}>
                            编辑
                          </Button>
                          <Popconfirm
                              title="确认停用？"
                              onConfirm={async () => {
                                try {
                                  if (isApiMode()) await apiDeactivateCountry(r.id)
                                  deactivateCountry(r.id)
                                  message.success('已停用')
                                } catch (e) {
                                  message.error(e instanceof Error ? e.message : '停用失败')
                                }
                              }}
                            >
                              <Button type="link" danger size="small" icon={<DeleteOutlined />}>停用</Button>
                            </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'company',
            label: (
              <span>
                <BankOutlined />
                公司管理
              </span>
            ),
            children: (
              <Card
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => { setCompanyModal({ open: true }); companyForm.resetFields() }}>
                    新建公司
                  </Button>
                }
              >
                <Space wrap style={{ marginBottom: 16 }}>
                  <Input
                    placeholder="搜索公司名称/编号"
                    prefix={<SearchOutlined />}
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    onPressEnter={() => setAppliedCompanySearch(companySearch)}
                    style={{ width: 200 }}
                    allowClear
                  />
                  <Button icon={<SearchOutlined />} onClick={() => setAppliedCompanySearch(companySearch)}>查询</Button>
                  <Button icon={<ReloadOutlined />} onClick={() => { setCompanySearch(''); setAppliedCompanySearch('') }}>重置</Button>
                </Space>
                <Table
                  dataSource={filteredCompanies}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: '公司编号', dataIndex: 'companyNo', width: 120, render: (v) => <Text code>{v}</Text> },
                    { title: '公司名称', dataIndex: 'companyName' },
                    {
                      title: '所属国家',
                      dataIndex: 'countryId',
                      width: 100,
                      render: (id) => countries.find((c) => c.id === id)?.name || id,
                    },
                    { title: '更新时间', dataIndex: 'updatedAt', width: 120 },
                    {
                      title: '操作',
                      width: 120,
                      render: (_, r) => (
                        <Space>
                          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setCompanyModal({ open: true, editing: r }); companyForm.setFieldsValue(r) }}>
                            编辑
                          </Button>
                          <Popconfirm
                              title="确认停用？"
                              onConfirm={async () => {
                                try {
                                  if (isApiMode()) await apiDeactivateCompany(r.id)
                                  deactivateCompany(r.id)
                                  message.success('已停用')
                                } catch (e) {
                                  message.error(e instanceof Error ? e.message : '停用失败')
                                }
                              }}
                            >
                              <Button type="link" danger size="small" icon={<DeleteOutlined />}>停用</Button>
                            </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'role',
            label: (
              <span>
                <SafetyOutlined />
                角色管理
              </span>
            ),
            children: (
              <Card
                extra={
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    disabled={!selectedCompanyId}
                    onClick={() => {
                      if (!selectedCompanyId) { message.warning('请先在顶部选择公司'); return }
                      setRoleModal({ open: true })
                      roleForm.resetFields()
                    }}
                  >
                    新建角色
                  </Button>
                }
              >
                <Space wrap style={{ marginBottom: 16 }}>
                  <Input
                    placeholder="搜索角色名称"
                    prefix={<SearchOutlined />}
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    onPressEnter={() => setAppliedRoleSearch(roleSearch)}
                    style={{ width: 200 }}
                    allowClear
                  />
                  <Button icon={<SearchOutlined />} onClick={() => setAppliedRoleSearch(roleSearch)}>查询</Button>
                  <Button icon={<ReloadOutlined />} onClick={() => { setRoleSearch(''); setAppliedRoleSearch('') }}>重置</Button>
                </Space>
                <Table
                  dataSource={filteredRoles}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: '角色名称', dataIndex: 'name', width: 120 },
                    {
                      title: '数据范围',
                      dataIndex: 'dataScope',
                      width: 120,
                      render: (v: DataScope) => DATA_SCOPE_OPTIONS.find((o) => o.value === v)?.label || v,
                    },
                    {
                      title: '菜单权限',
                      render: (_, r) => (
                        <Space wrap size={[4, 4]}>
                          {(r.menuKeys || []).slice(0, 4).map((k) => (
                            <Tag key={k}>{MENU_LABELS[k] || k}</Tag>
                          ))}
                          {(r.menuKeys?.length || 0) > 4 && <Tag>+{(r.menuKeys?.length || 0) - 4}</Tag>}
                        </Space>
                      ),
                    },
                    {
                      title: '操作',
                      width: 120,
                      render: (_, r) => (
                        <Space>
                          <Button
                            type="link"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                              setRoleModal({ open: true, editing: r })
                              roleForm.setFieldsValue({ ...r, menuKeys: r.menuKeys || [], buttonCodes: r.buttonCodes || [] })
                            }}
                          >
                            编辑
                          </Button>
                          <Popconfirm
                              title="确认停用？"
                              onConfirm={async () => {
                                try {
                                  if (isApiMode()) await apiDeactivateRole(r.id)
                                  deactivateRole(r.id)
                                  message.success('已停用')
                                } catch (e) {
                                  message.error(e instanceof Error ? e.message : '停用失败')
                                }
                              }}
                            >
                              <Button type="link" danger size="small" icon={<DeleteOutlined />}>停用</Button>
                            </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'user',
            label: (
              <span>
                <UserOutlined />
                用户管理
              </span>
            ),
            children: (
              <Card
                extra={
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    disabled={!selectedCompanyId}
                    onClick={() => {
                      if (!selectedCompanyId) { message.warning('请先在顶部选择公司'); return }
                      setUserModal({ open: true })
                      userForm.resetFields()
                    }}
                  >
                    新建用户
                  </Button>
                }
              >
                <Space wrap style={{ marginBottom: 16 }}>
                  <Input
                    placeholder="搜索姓名/工号"
                    prefix={<SearchOutlined />}
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onPressEnter={() => setAppliedUserSearch(userSearch)}
                    style={{ width: 200 }}
                    allowClear
                  />
                  <Button icon={<SearchOutlined />} onClick={() => setAppliedUserSearch(userSearch)}>查询</Button>
                  <Button icon={<ReloadOutlined />} onClick={() => { setUserSearch(''); setAppliedUserSearch('') }}>重置</Button>
                </Space>
                <Table
                  dataSource={filteredEmployees}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  columns={[
                    { title: '工号', dataIndex: 'empNo', width: 100, render: (v) => <Text code>{v}</Text> },
                    { title: '姓名', dataIndex: 'name', width: 100 },
                    {
                      title: '角色',
                      dataIndex: 'roleId',
                      width: 120,
                      render: (id, r) => {
                        const role = roles.find((x) => x.id === id)
                        return role ? <Tag>{role.name}</Tag> : <Tag>{r.role}</Tag>
                      },
                    },
                    {
                      title: '分配区域',
                      dataIndex: 'assignedRegionIds',
                      render: (ids: string[]) =>
                        ids?.length ? regions.filter((r) => ids.includes(r.id)).map((r) => r.name).join('、') || '-' : '-',
                    },
                    {
                      title: '分配门店',
                      dataIndex: 'assignedStoreIds',
                      render: (ids: string[]) =>
                        ids?.length ? stores.filter((s) => ids.includes(s.id)).map((s) => s.storeName).join('、') || '区域下全部' : '区域下全部',
                    },
                    {
                      title: '操作',
                      width: 120,
                      render: (_, r) => (
                        <Space>
                          <Button
                            type="link"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                              setUserModal({ open: true, editing: r })
                              userForm.setFieldsValue({
                                ...r,
                                roleId: r.roleId || undefined,
                                assignedRegionIds: r.assignedRegionIds || [],
                                assignedStoreIds: r.assignedStoreIds || [],
                              })
                            }}
                          >
                            编辑
                          </Button>
                          <Popconfirm
                              title="确认离职处理？"
                              onConfirm={async () => {
                                try {
                                  if (isApiMode()) await apiDeactivateEmployee(r.id)
                                  deactivateEmployee(r.id)
                                  message.success('已离职')
                                } catch (e) {
                                  message.error(e instanceof Error ? e.message : '离职失败')
                                }
                              }}
                            >
                              <Button type="link" danger size="small" icon={<DeleteOutlined />}>离职</Button>
                            </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />

      <Modal title={countryModal.editing ? '编辑国家' : '新建国家'} open={countryModal.open} onOk={handleCountrySubmit} onCancel={() => setCountryModal({ open: false })}>
        <Form form={countryForm} layout="vertical" initialValues={countryModal.editing}>
          <Form.Item name="code" label="国家代码" rules={[{ required: true }]}>
            <Input placeholder="如 CN、VN" />
          </Form.Item>
          <Form.Item name="name" label="国家名称" rules={[{ required: true }]}>
            <Input placeholder="如 中国、越南" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={companyModal.editing ? '编辑公司' : '新建公司'} open={companyModal.open} onOk={handleCompanySubmit} onCancel={() => setCompanyModal({ open: false })} width={480}>
        <Form form={companyForm} layout="vertical" initialValues={companyModal.editing}>
          <Form.Item name="countryId" label="所属国家" rules={[{ required: true }]}>
            <Select placeholder="选择国家" options={activeCountries.map((c) => ({ label: c.name, value: c.id }))} />
          </Form.Item>
          <Form.Item name="companyNo" label="公司编号">
            <Input placeholder="如 OHMEE-CN，留空自动生成" />
          </Form.Item>
          <Form.Item name="companyName" label="公司名称" rules={[{ required: true }]}>
            <Input placeholder="如 Ohmee 中国" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={roleModal.editing ? '编辑角色' : '新建角色'} open={roleModal.open} onOk={handleRoleSubmit} onCancel={() => setRoleModal({ open: false })} width={640}>
        <Form form={roleForm} layout="vertical" initialValues={{ menuKeys: [], buttonCodes: [] }}>
          <Form.Item name="name" label="角色名称" rules={[{ required: true }]}>
            <Input placeholder="如 督导、店长" />
          </Form.Item>
          <Form.Item name="dataScope" label="数据权限范围" rules={[{ required: true }]}>
            <Select options={DATA_SCOPE_OPTIONS} placeholder="选择数据范围" />
          </Form.Item>
          <Form.Item name="menuKeys" label="菜单权限">
            <Checkbox.Group options={ALL_PC_MENU_KEYS.map((k) => ({ label: MENU_LABELS[k] || k, value: k }))} />
          </Form.Item>
          <Form.Item name="buttonCodes" label="按钮权限">
            <Checkbox.Group
              options={ALL_BUTTON_CODES.map((c) => ({ label: BUTTON_LABELS[c] || c, value: c }))}
              style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={userModal.editing ? '编辑用户' : '新建用户'} open={userModal.open} onOk={handleUserSubmit} onCancel={() => setUserModal({ open: false })} width={560}>
        <Form form={userForm} layout="vertical" initialValues={{ assignedRegionIds: [], assignedStoreIds: [] }}>
          {!userModal.editing ? (
            <>
              <Form.Item name="empNo" label="工号">
                <Input placeholder="留空自动生成" />
              </Form.Item>
              <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="gender" label="性别" rules={[{ required: true }]}>
                <Select options={[{ label: '男', value: '男' }, { label: '女', value: '女' }]} placeholder="选择" />
              </Form.Item>
              <Form.Item name="age" label="年龄" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
              <Form.Item name="joinDate" label="入职日期" rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
              <Form.Item name="storeId" label="所属门店" rules={[{ required: true }]}>
                <Select options={companyStores.map((s) => ({ label: s.storeName, value: s.id }))} placeholder="选择门店" />
              </Form.Item>
              <Form.Item name="regionId" label="所属区域" rules={[{ required: true }]}>
                <Select options={companyRegions.map((r) => ({ label: r.name, value: r.id }))} placeholder="选择区域" />
              </Form.Item>
            </>
          ) : null}
          <Form.Item name="roleId" label="角色">
            <Select options={companyRoles.map((r) => ({ label: r.name, value: r.id }))} placeholder="选择角色" allowClear />
          </Form.Item>
          <Form.Item name="assignedRegionIds" label="分配区域" extra="区域/门店 scope 时生效，未分配门店则默认该区域下所有门店">
            <Select mode="multiple" options={companyRegions.map((r) => ({ label: r.name, value: r.id }))} placeholder="选择区域" allowClear />
          </Form.Item>
          <Form.Item name="assignedStoreIds" label="分配门店" extra="留空则使用分配区域下的全部门店">
            <Select mode="multiple" options={companyStores.map((s) => ({ label: s.storeName, value: s.id }))} placeholder="选择门店，留空=区域全部" allowClear />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
