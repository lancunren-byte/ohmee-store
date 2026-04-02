import React, { useState, useCallback } from 'react'
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
  Card,
  Badge,
  Tooltip,
  message,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  StopOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useAppStore } from '../../store'
import { usePermission } from '../../hooks/usePermission'
import { Store, StoreStatus, StoreType } from '../../types'
import { getStoreStatusColor, reverseGeocode } from '../../utils/helpers'
import { isApiMode, apiCreateStore, apiUpdateStore, apiDeactivateStore } from '../../api/client'
import dayjs from 'dayjs'

const { Title, Text } = Typography

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const storeStatusOptions: StoreStatus[] = ['营业中', '建设中', '已闭店', '待搬迁']
const storeTypeOptions: StoreType[] = ['直营店', '托管店', '特许加盟店']

interface MapClickProps {
  onLocationSelect: (lat: number, lng: number) => void
}

function MapClickHandler({ onLocationSelect }: MapClickProps) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface MapPickerProps {
  lat: number
  lng: number
  onChange: (lat: number, lng: number) => void
}

function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  return (
    <MapContainer
      center={[lat || 31.2304, lng || 121.4737]}
      zoom={13}
      style={{ height: 300, width: '100%', borderRadius: 8 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <MapClickHandler onLocationSelect={onChange} />
      {lat && lng && <Marker position={[lat, lng]} />}
    </MapContainer>
  )
}

export default function StoreManagement() {
  const { addStore, addStoreFromApi, updateStore, deactivateStore, selectedCompanyId, getScopedStores, getScopedRegions, getScopedEmployees } = useAppStore()
  const { can } = usePermission()
  const companyStores = selectedCompanyId ? getScopedStores(selectedCompanyId) : []
  const companyRegions = selectedCompanyId ? getScopedRegions(selectedCompanyId) : []
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [searchText, setSearchText] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [form] = Form.useForm()
  const [mapLat, setMapLat] = useState(31.2304)
  const [mapLng, setMapLng] = useState(121.4737)
  const [isGeocoding, setIsGeocoding] = useState(false)

  const scopedEmployees = selectedCompanyId ? getScopedEmployees(selectedCompanyId) : []
  const supervisors = scopedEmployees.filter((e) => e.role === '督导')
  const managers = scopedEmployees.filter((e) => e.role === '店长')

  const filteredStores = companyStores.filter(
    (s) =>
      s.isActive &&
      (appliedSearch === '' ||
        s.storeName.includes(appliedSearch) ||
        s.storeNo.includes(appliedSearch) ||
        s.address.includes(appliedSearch)),
  )

  const handleQuery = () => setAppliedSearch(searchText)
  const handleReset = () => {
    setSearchText('')
    setAppliedSearch('')
  }

  const canAdd = can.button('store:add')
  const canEdit = can.button('store:edit')
  const canDelete = can.button('store:delete')

  const handleOpenAdd = () => {
    setEditingStore(null)
    form.resetFields()
    setMapLat(31.2304)
    setMapLng(121.4737)
    setIsModalOpen(true)
  }

  const handleEdit = (store: Store) => {
    setEditingStore(store)
    form.setFieldsValue(store)
    setMapLat(store.lat)
    setMapLng(store.lng)
    setIsModalOpen(true)
  }

  const handleDeactivate = async (id: string) => {
    try {
      if (isApiMode()) await apiDeactivateStore(id)
      deactivateStore(id)
      message.success('门店已作废')
    } catch (e) {
      message.error(e instanceof Error ? e.message : '作废失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingStore) {
        if (isApiMode()) await apiUpdateStore(editingStore.id, values)
        updateStore(editingStore.id, values)
        message.success('门店信息已更新')
      } else {
        const storeNo = `ST${String(companyStores.length + 1).padStart(3, '0')}`
        const payload = { ...values, storeNo, companyId: selectedCompanyId || '', isActive: true }
        if (isApiMode()) {
          const created = await apiCreateStore(payload)
          addStoreFromApi(created)
        } else {
          addStore(payload)
        }
        message.success('门店创建成功')
      }
      setIsModalOpen(false)
    } catch (e) {
      if (e instanceof Error) message.error(e.message)
    }
  }

  const handleMapLocationSelect = useCallback(
    async (lat: number, lng: number) => {
      setMapLat(lat)
      setMapLng(lng)
      form.setFieldsValue({ lat, lng })
      setIsGeocoding(true)
      const address = await reverseGeocode(lat, lng)
      form.setFieldsValue({ address })
      setIsGeocoding(false)
    },
    [form],
  )

  const handleOpenMapModal = () => {
    const values = form.getFieldsValue()
    if (values.lat) setMapLat(values.lat)
    if (values.lng) setMapLng(values.lng)
    setIsMapModalOpen(true)
  }

  const handleConfirmLocation = () => {
    form.setFieldsValue({ lat: mapLat, lng: mapLng })
    setIsMapModalOpen(false)
  }

  const columns = [
    {
      title: '店号',
      dataIndex: 'storeNo',
      key: 'storeNo',
      width: 100,
      render: (v: string) => <Text code>{v}</Text>,
    },
    {
      title: '门店名称',
      dataIndex: 'storeName',
      key: 'storeName',
      width: 180,
    },
    {
      title: '门店地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (v: string) => (
        <Tooltip title={v}>
          <span>{v}</span>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => (
        <Badge color={getStoreStatusColor(v)} text={v} />
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (v: string) => {
        const colorMap: Record<string, string> = {
          直营店: 'blue',
          托管店: 'green',
          特许加盟店: 'orange',
        }
        return <Tag color={colorMap[v]}>{v}</Tag>
      },
    },
    {
      title: '所属区域',
      dataIndex: 'regionId',
      key: 'regionId',
      width: 100,
      render: (v: string) => companyRegions.find((r) => r.id === v)?.name || '-',
    },
    {
      title: '督导',
      dataIndex: 'supervisorId',
      key: 'supervisorId',
      width: 100,
      render: (v: string) => scopedEmployees.find((e) => e.id === v)?.name || '-',
    },
    {
      title: '店长',
      dataIndex: 'managerId',
      key: 'managerId',
      width: 100,
      render: (v: string) => scopedEmployees.find((e) => e.id === v)?.name || '-',
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 110,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: Store) => (
        <Space>
          {canEdit && (
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}
          {canDelete && (
            <Popconfirm
              title="确认作废此门店？"
              description="作废后门店将标记为已关闭，无法恢复。"
              onConfirm={() => handleDeactivate(record.id)}
              okText="确认"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button type="link" danger icon={<StopOutlined />} size="small">
                作废
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
            门店管理
          </Title>
          <Text type="secondary">共 {filteredStores.length} 家门店</Text>
        </Col>
        <Col>
          <Space>
            <Input
              placeholder="搜索门店名称/店号/地址"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleQuery}
              style={{ width: 240 }}
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
                新增门店
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        {['营业中', '建设中', '已闭店', '待搬迁'].map((status) => {
          const count = companyStores.filter((s) => s.status === status && s.isActive).length
          return (
            <Col key={status} span={6}>
              <Card size="small" bordered={false} style={{ background: '#f5f5f5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{status}</Text>
                  <Text strong style={{ fontSize: 20, color: getStoreStatusColor(status) }}>
                    {count}
                  </Text>
                </div>
              </Card>
            </Col>
          )
        })}
      </Row>

      <Table
        columns={columns}
        dataSource={filteredStores}
        rowKey="id"
        size="middle"
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingStore ? '编辑门店' : '新增门店'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        width={700}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="storeName"
                label="门店名称"
                rules={[{ required: true, message: '请输入门店名称' }]}
              >
                <Input placeholder="请输入门店名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="门店状态"
                rules={[{ required: true, message: '请选择门店状态' }]}
              >
                <Select placeholder="请选择门店状态">
                  {storeStatusOptions.map((s) => (
                    <Select.Option key={s} value={s}>
                      <Badge color={getStoreStatusColor(s)} text={s} />
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="门店类型"
                rules={[{ required: true, message: '请选择门店类型' }]}
              >
                <Select placeholder="请选择门店类型">
                  {storeTypeOptions.map((t) => (
                    <Select.Option key={t} value={t}>
                      {t}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
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
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="supervisorId" label="所属督导">
                <Select placeholder="请选择督导" allowClear>
                  {supervisors.map((e) => (
                    <Select.Option key={e.id} value={e.id}>
                      {e.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="managerId" label="所属店长">
                <Select placeholder="请选择店长" allowClear>
                  {managers.map((e) => (
                    <Select.Option key={e.id} value={e.id}>
                      {e.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="门店地址"
            rules={[{ required: true, message: '请输入或选择门店地址' }]}
          >
            <Input
              placeholder="请输入地址或点击地图选择"
              suffix={
                <Button
                  type="link"
                  icon={<EnvironmentOutlined />}
                  size="small"
                  onClick={handleOpenMapModal}
                  style={{ padding: 0 }}
                >
                  地图选点
                </Button>
              }
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="lat"
                label="纬度"
                rules={[{ required: true, message: '请通过地图选择位置' }]}
              >
                <Input placeholder="纬度（地图选点自动填入）" readOnly />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lng"
                label="经度"
                rules={[{ required: true, message: '请通过地图选择位置' }]}
              >
                <Input placeholder="经度（地图选点自动填入）" readOnly />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <EnvironmentOutlined />
            地图选点
            {isGeocoding && <Text type="secondary" style={{ fontSize: 13 }}>正在获取地址...</Text>}
          </Space>
        }
        open={isMapModalOpen}
        onOk={handleConfirmLocation}
        onCancel={() => setIsMapModalOpen(false)}
        width={700}
        okText="确认位置"
        cancelText="取消"
      >
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary">
            点击地图选择门店位置，坐标将自动填入表单
          </Text>
        </div>
        <MapPicker lat={mapLat} lng={mapLng} onChange={handleMapLocationSelect} />
        {mapLat && mapLng && (
          <div style={{ marginTop: 12 }}>
            <Text>
              已选坐标：<Text code>{mapLat.toFixed(6)}</Text> ,{' '}
              <Text code>{mapLng.toFixed(6)}</Text>
            </Text>
          </div>
        )}
      </Modal>
    </div>
  )
}
