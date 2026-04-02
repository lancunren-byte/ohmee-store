import React, { useState } from 'react'
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Typography, Row, Col, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { useAppStore } from '../../store'
import { usePermission } from '../../hooks/usePermission'
import { Region } from '../../types'
import { isApiMode, apiCreateRegion, apiUpdateRegion, apiDeleteRegion } from '../../api/client'

const { Title, Text } = Typography

export default function RegionManagement() {
  const { addRegion, addRegionFromApi, updateRegion, deleteRegion, selectedCompanyId, getScopedRegions } = useAppStore()
  const { can } = usePermission()
  const displayRegions = selectedCompanyId ? getScopedRegions(selectedCompanyId) : []
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRegion, setEditingRegion] = useState<Region | null>(null)
  const [searchText, setSearchText] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [form] = Form.useForm()

  const handleQuery = () => setAppliedSearch(searchText)
  const handleReset = () => {
    setSearchText('')
    setAppliedSearch('')
  }

  const displayRegionsFiltered = displayRegions.filter(
    (r) => appliedSearch === '' || r.name.toLowerCase().includes(appliedSearch.toLowerCase()),
  )

  const canAdd = can.button('region:add')
  const canEdit = can.button('region:edit')
  const canDelete = can.button('region:delete')

  const handleOpenAdd = () => {
    if (!selectedCompanyId) {
      message.warning('请先在顶部选择公司')
      return
    }
    setEditingRegion(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleEdit = (region: Region) => {
    setEditingRegion(region)
    form.setFieldsValue(region)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      if (isApiMode()) await apiDeleteRegion(id)
      deleteRegion(id)
      message.success('区域已删除')
    } catch (e) {
      message.error(e instanceof Error ? e.message : '删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingRegion) {
        if (isApiMode()) await apiUpdateRegion(editingRegion.id, values)
        updateRegion(editingRegion.id, values)
        message.success('区域已更新')
      } else {
        const payload = { ...values, companyId: selectedCompanyId || '' }
        if (isApiMode()) {
          const created = await apiCreateRegion(payload)
          addRegionFromApi(created)
        } else {
          addRegion(payload)
        }
        message.success('区域已创建')
      }
      setIsModalOpen(false)
    } catch (e) {
      if (e instanceof Error) message.error(e.message)
    }
  }

  const columns = [
    {
      title: '区域名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: Region) => (
        <Space>
          {canEdit && (
            <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}
          {canDelete && (
            <Popconfirm
              title="确认删除此区域？"
              onConfirm={() => handleDelete(record.id)}
              okText="确认"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button type="link" danger icon={<DeleteOutlined />} size="small">
                删除
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
            区域管理
          </Title>
          <Text type="secondary">共 {displayRegionsFiltered.length} 个区域</Text>
        </Col>
        <Col>
          <Space>
            <Input
              placeholder="搜索区域名称"
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
            新增区域
          </Button>
          )}
          </Space>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={displayRegionsFiltered}
        rowKey="id"
        size="middle"
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
      />

      <Modal
        title={editingRegion ? '编辑区域' : '新增区域'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="区域名称" rules={[{ required: true, message: '请输入区域名称' }]}>
            <Input placeholder="请输入区域名称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
