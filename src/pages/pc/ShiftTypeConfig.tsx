import React, { useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  Typography,
  Row,
  Col,
  Tag,
  message,
} from 'antd'
import { PlusOutlined, EditOutlined, StopOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { useAppStore } from '../../store'
import { usePermission } from '../../hooks/usePermission'
import { ShiftType } from '../../types'
import { isApiMode, apiCreateShiftType, apiUpdateShiftType, apiDeactivateShiftType } from '../../api/client'
import dayjs from 'dayjs'

const { Title, Text } = Typography

export default function ShiftTypeConfig() {
  const { currentUser, addShiftType, addShiftTypeFromApi, updateShiftType, deactivateShiftType, selectedCompanyId, getScopedShiftTypes } = useAppStore()
  const { can } = usePermission()
  const companyShiftTypes = selectedCompanyId ? getScopedShiftTypes(selectedCompanyId) : []
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingType, setEditingType] = useState<ShiftType | null>(null)
  const [searchText, setSearchText] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [form] = Form.useForm()

  const handleQuery = () => setAppliedSearch(searchText)
  const handleReset = () => {
    setSearchText('')
    setAppliedSearch('')
  }

  const activeTypes = companyShiftTypes.filter((st) => st.isActive)
  const displayShiftTypes = companyShiftTypes.filter(
    (st) => appliedSearch === '' || st.typeName.toLowerCase().includes(appliedSearch.toLowerCase()),
  )

  const canAdd = can.button('shiftType:add')
  const canEdit = can.button('shiftType:edit')
  const canDelete = can.button('shiftType:delete')

  const handleOpenAdd = () => {
    setEditingType(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleEdit = (st: ShiftType) => {
    setEditingType(st)
    form.setFieldsValue(st)
    setIsModalOpen(true)
  }

  const handleDeactivate = async (id: string) => {
    try {
      if (isApiMode()) await apiDeactivateShiftType(id)
      deactivateShiftType(id)
      message.success('班次类型已停用')
    } catch (e) {
      message.error(e instanceof Error ? e.message : '停用失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const updatedBy = currentUser?.name || '管理员'
      if (editingType) {
        if (isApiMode()) await apiUpdateShiftType(editingType.id, { ...values, updatedBy })
        updateShiftType(editingType.id, { ...values, updatedBy })
        message.success('班次类型已更新')
      } else {
        const typeNo = `ST${String(companyShiftTypes.length + 1).padStart(3, '0')}`
        const payload = { ...values, typeNo, companyId: selectedCompanyId || '', updatedBy, isActive: true }
        if (isApiMode()) {
          const created = await apiCreateShiftType(payload)
          addShiftTypeFromApi(created)
        } else {
          addShiftType(payload)
        }
        message.success('班次类型已创建')
      }
      setIsModalOpen(false)
    } catch (e) {
      if (e instanceof Error) message.error(e.message)
    }
  }

  const columns = [
    {
      title: '类型编号',
      dataIndex: 'typeNo',
      key: 'typeNo',
      width: 120,
      render: (v: string) => <Text code>{v}</Text>,
    },
    {
      title: '班次类型名称',
      dataIndex: 'typeName',
      key: 'typeName',
      render: (v: string) => (
        <Tag color="blue" style={{ fontSize: 14, padding: '2px 12px' }}>
          {v}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (v: boolean) => (
        <Tag color={v ? 'success' : 'default'}>{v ? '启用' : '停用'}</Tag>
      ),
    },
    {
      title: '修改人',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
      width: 120,
    },
    {
      title: '修改时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 130,
      render: (_: unknown, record: ShiftType) => (
        <Space>
          {canEdit && (
            <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}
          {canDelete && (
            <Popconfirm
              title="确认停用此班次类型？"
              onConfirm={() => handleDeactivate(record.id)}
              okText="确认"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button type="link" danger icon={<StopOutlined />} size="small">
                停用
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            班次类型配置
          </Title>
          <Text type="secondary">共 {displayShiftTypes.length} 个班次类型</Text>
        </Col>
        <Col>
          <Space>
            <Input
              placeholder="搜索班次类型名称"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleQuery}
              style={{ width: 180 }}
              allowClear
            />
            <Button icon={<SearchOutlined />} onClick={handleQuery}>
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
            {canAdd && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd}>
              新增班次类型
            </Button>
          )}
          </Space>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={displayShiftTypes}
        rowKey="id"
        size="middle"
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
      />

      <Modal
        title={editingType ? '编辑班次类型' : '新增班次类型'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="typeName"
            label="班次类型名称"
            rules={[{ required: true, message: '请输入班次类型名称' }]}
          >
            <Input placeholder="如：早班、中班、晚班、大夜班" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
