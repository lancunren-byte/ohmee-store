import React, { useState } from 'react'
import {
  Table,
  Tag,
  Button,
  Select,
  DatePicker,
  Space,
  Typography,
  Modal,
  Descriptions,
  Image,
  Badge,
  Empty,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useAppStore } from '../../store'
import { HandoverRecord } from '../../types'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const STATUS_TAG: Record<string, { color: string; text: string }> = {
  待审核: { color: 'warning', text: '待审核' },
  已确认: { color: 'success', text: '已确认' },
  已驳回: { color: 'error', text: '已驳回' },
}

const PHOTO_LABELS: { key: keyof HandoverRecord; label: string }[] = [
  { key: 'photoEntrance', label: '门前卫生' },
  { key: 'photoCooked', label: '熟食区' },
  { key: 'photoWindCabinet', label: '风幕柜' },
  { key: 'photoWaterCabinet', label: '水柜' },
  { key: 'photoShelf', label: '货架区' },
  { key: 'photoWarehouse', label: '仓库' },
  { key: 'photoHandover', label: '交接拍照（现金与交接单）' },
]

export default function HandoverQuery() {
  const { selectedCompanyId, getScopedHandovers, getScopedStores } = useAppStore()
  const companyHandovers = selectedCompanyId ? getScopedHandovers(selectedCompanyId) : []
  const companyStores = selectedCompanyId ? getScopedStores(selectedCompanyId) : []

  const [filterStore, setFilterStore] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterDates, setFilterDates] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [appliedStore, setAppliedStore] = useState<string>('')
  const [appliedStatus, setAppliedStatus] = useState<string>('')
  const [appliedDates, setAppliedDates] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [detailRecord, setDetailRecord] = useState<HandoverRecord | null>(null)

  const handleQuery = () => {
    setAppliedStore(filterStore)
    setAppliedStatus(filterStatus)
    setAppliedDates(filterDates)
  }
  const handleReset = () => {
    setFilterStore('')
    setFilterStatus('')
    setFilterDates(null)
    setAppliedStore('')
    setAppliedStatus('')
    setAppliedDates(null)
  }

  const storeOptions = companyStores.filter((s) => s.isActive).map((s) => ({ value: s.id, label: s.storeName }))

  const filtered = companyHandovers.filter((h) => {
    if (appliedStore && h.storeId !== appliedStore) return false
    if (appliedStatus && h.status !== appliedStatus) return false
    if (appliedDates) {
      const d = h.createdAt.slice(0, 10)
      if (d < appliedDates[0].format('YYYY-MM-DD') || d > appliedDates[1].format('YYYY-MM-DD')) return false
    }
    return true
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const pendingCount = companyHandovers.filter((h) => h.status === '待审核').length

  const getStoreName = (id: string) => companyStores.find((s) => s.id === id)?.storeName || id

  const columns: ColumnsType<HandoverRecord> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 150,
      render: (v) => <Text style={{ fontSize: 13 }}>{v.slice(0, 16)}</Text>,
    },
    {
      title: '门店',
      dataIndex: 'storeId',
      width: 140,
      render: (v) => getStoreName(v),
    },
    {
      title: '交班人',
      width: 160,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.handoverEmpName}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.handoverRole} · {r.handoverShiftName}</Text>
        </div>
      ),
    },
    {
      title: '接班人',
      render: (_, r) => (
        <div>
          {r.receivers.map((rc) => (
            <div key={rc.empId} style={{ fontSize: 13 }}>
              {rc.empName} <Text type="secondary" style={{ fontSize: 12 }}>({rc.role})</Text>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: '现金差异',
      width: 110,
      render: (_, r) => r.cashDifference
        ? <Tag color="error">有差异 ¥{r.cashDiffAmount}</Tag>
        : <Tag color="success">无差异</Tag>,
    },
    {
      title: '盘点情况',
      width: 110,
      render: (_, r) => {
        if (!r.hasInventory) return <Tag>未盘点</Tag>
        return r.inventoryDiff ? <Tag color="warning">有差异</Tag> : <Tag color="success">无差异</Tag>
      },
    },
    {
      title: '已补货',
      width: 80,
      render: (_, r) => r.hasRestocked ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#faad14' }} />,
    },
    {
      title: '状态',
      width: 90,
      render: (_, r) => {
        const s = STATUS_TAG[r.status]
        return <Tag color={s.color}>{s.text}</Tag>
      },
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right' as const,
      render: (_, r) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setDetailRecord(r)}
        >
          详情
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>门店交接班查询</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>查看各门店班次交接明细及照片记录</Text>
        </div>
        {pendingCount > 0 && (
          <Badge count={pendingCount} offset={[4, 0]}>
            <Tag color="warning" style={{ fontSize: 13, padding: '4px 10px' }}>待审核记录</Tag>
          </Badge>
        )}
      </div>

      {/* 筛选栏 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', padding: '16px', background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
        <Select
          placeholder="选择门店"
          allowClear
          style={{ width: 180 }}
          options={storeOptions}
          value={filterStore || undefined}
          onChange={(v) => setFilterStore(v || '')}
        />
        <Select
          placeholder="审核状态"
          allowClear
          style={{ width: 130 }}
          options={[
            { value: '待审核', label: '待审核' },
            { value: '已确认', label: '已确认' },
            { value: '已驳回', label: '已驳回' },
          ]}
          value={filterStatus || undefined}
          onChange={(v) => setFilterStatus(v || '')}
        />
        <RangePicker
          value={filterDates}
          onChange={(v) => setFilterDates(v as [dayjs.Dayjs, dayjs.Dayjs] | null)}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleQuery}>
          查询
        </Button>
        <Button icon={<ReloadOutlined />} onClick={handleReset}>
          重置
        </Button>
      </div>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        size="middle"
        scroll={{ x: 1000 }}
        pagination={{ pageSize: 20, showTotal: (total) => `共 ${total} 条` }}
        locale={{ emptyText: <Empty description="暂无交接班记录" /> }}
        rowClassName={(r) => r.status === '待审核' ? 'handover-pending-row' : ''}
      />

      {/* 详情弹窗 */}
      <Modal
        open={!!detailRecord}
        title="交接班详情"
        width={760}
        footer={null}
        onCancel={() => setDetailRecord(null)}
        styles={{ body: { maxHeight: '75vh', overflowY: 'auto' } }}
      >
        {detailRecord && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="门店" span={2}>{getStoreName(detailRecord.storeId)}</Descriptions.Item>
              <Descriptions.Item label="时间" span={2}>{detailRecord.createdAt.slice(0, 16)}</Descriptions.Item>
              <Descriptions.Item label="交班人">
                {detailRecord.handoverEmpName}
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>
                  {detailRecord.handoverRole} · {detailRecord.handoverShiftName}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="接班人">
                {detailRecord.receivers.map((r) => (
                  <div key={r.empId}>{r.empName} <Text type="secondary">({r.role} · {r.shiftName})</Text></div>
                ))}
              </Descriptions.Item>
              <Descriptions.Item label="现金差异">
                {detailRecord.cashDifference ? (
                  <Space>
                    <Tag color="error">有差异</Tag>
                    <span>¥{detailRecord.cashDiffAmount}</span>
                    <Text type="secondary">{detailRecord.cashDiffReason}</Text>
                  </Space>
                ) : <Tag color="success">无差异</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="盘点情况">
                {!detailRecord.hasInventory ? <Tag>未盘点</Tag> : (
                  <Space direction="vertical" size={2}>
                    {detailRecord.inventoryDiff ? <Tag color="warning">有差异</Tag> : <Tag color="success">无差异</Tag>}
                    {detailRecord.inventoryDiff && <Text type="secondary" style={{ fontSize: 12 }}>{detailRecord.inventoryDiffNote}</Text>}
                  </Space>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="已补货">
                {detailRecord.hasRestocked
                  ? <Tag color="success">是</Tag>
                  : <Tag color="warning">否</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="审核状态">
                <Tag color={STATUS_TAG[detailRecord.status].color}>{STATUS_TAG[detailRecord.status].text}</Tag>
              </Descriptions.Item>
              {detailRecord.reviewNote && (
                <Descriptions.Item label="驳回原因" span={2}>
                  <Text type="danger">{detailRecord.reviewNote}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Title level={5} style={{ marginBottom: 16 }}>现场照片</Title>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {PHOTO_LABELS.map(({ key, label }) => {
                const src = detailRecord[key] as string | undefined
                return (
                  <div key={key} style={{ textAlign: 'center' }}>
                    <div style={{ height: 100, borderRadius: 8, border: '1px solid #f0f0f0', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {src ? (
                        <Image
                          src={src}
                          alt={label}
                          style={{ width: '100%', height: 100, objectFit: 'cover' }}
                          preview={{ mask: '查看' }}
                        />
                      ) : (
                        <Text type="secondary" style={{ fontSize: 12 }}>未拍照</Text>
                      )}
                    </div>
                    <Text style={{ fontSize: 12, color: '#666', display: 'block', marginTop: 4 }}>{label}</Text>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
