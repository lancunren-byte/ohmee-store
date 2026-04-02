import React, { useMemo, useState } from 'react'
import { Table, Select, Button, Space, Typography, Tag } from 'antd'
import { DownloadOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { useAppStore } from '../../store'
import dayjs from 'dayjs'

const { Title, Text } = Typography

export default function ShiftList() {
  const { shifts, shiftTypes, stores, getScopedStores, selectedCompanyId } = useAppStore()
  const [storeFilter, setStoreFilter] = useState<string | undefined>()
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [appliedStore, setAppliedStore] = useState<string | undefined>()
  const [appliedType, setAppliedType] = useState<string[]>([])
  const [appliedStatus, setAppliedStatus] = useState<string | undefined>()

  const scopedStores = selectedCompanyId ? getScopedStores(selectedCompanyId) : []

  const handleQuery = () => {
    setAppliedStore(storeFilter)
    setAppliedType(typeFilter)
    setAppliedStatus(statusFilter)
  }
  const handleReset = () => {
    setStoreFilter(undefined)
    setTypeFilter([])
    setStatusFilter(undefined)
    setAppliedStore(undefined)
    setAppliedType([])
    setAppliedStatus(undefined)
  }

  const filteredShifts = useMemo(() => {
  let list = shifts.filter((s) => scopedStores.some((st) => st.id === s.storeId))
    if (appliedStore) list = list.filter((s) => s.storeId === appliedStore)
    if (appliedType.length) list = list.filter((s) => appliedType.includes(s.typeId))
    if (appliedStatus) {
      if (appliedStatus === '启用') list = list.filter((s) => s.isActive)
      else list = list.filter((s) => !s.isActive)
    }
    return list
  }, [shifts, scopedStores, appliedStore, appliedType, appliedStatus])

  const companyShiftTypes = useMemo(
    () => shiftTypes.filter((st) => scopedStores.some((s) => s.companyId === st.companyId) && st.isActive),
    [shiftTypes, scopedStores],
  )

  const columns = [
    {
      title: '所属门店',
      dataIndex: 'storeId',
      key: 'storeId',
      render: (id: string) => stores.find((s) => s.id === id)?.storeName + ' ' + (stores.find((s) => s.id === id)?.storeNo || ''),
    },
    {
      title: '班次名称',
      dataIndex: 'shiftName',
      key: 'shiftName',
    },
    {
      title: '班次类型',
      dataIndex: 'typeId',
      key: 'typeId',
      render: (id: string) => shiftTypes.find((t) => t.id === id)?.typeName || '-',
    },
    {
      title: '上班时间',
      dataIndex: 'startTime',
      key: 'startTime',
    },
    {
      title: '下班时间',
      dataIndex: 'endTime',
      key: 'endTime',
    },
    {
      title: '时长',
      key: 'duration',
      render: (_: unknown, r: { startTime: string; endTime: string }) => {
        const [sh, sm] = r.startTime.split(':').map(Number)
        const [eh, em] = r.endTime.split(':').map(Number)
        let h = eh - sh + (em - sm) / 60
        if (h < 0) h += 24
        return `${h.toFixed(1)} 小时`
      },
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '启用' : '停用'}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
  ]

  const handleExport = () => {
    const headers = ['所属门店', '班次名称', '班次类型', '上班时间', '下班时间', '时长', '状态', '创建时间']
    const rows = filteredShifts.map((s) => {
      const store = stores.find((st) => st.id === s.storeId)
      const type = shiftTypes.find((t) => t.id === s.typeId)
      const [sh, sm] = s.startTime.split(':').map(Number)
      const [eh, em] = s.endTime.split(':').map(Number)
      let h = eh - sh + (em - sm) / 60
      if (h < 0) h += 24
      return [
        `${store?.storeName || ''} ${store?.storeNo || ''}`,
        s.shiftName,
        type?.typeName || '',
        s.startTime,
        s.endTime,
        `${h.toFixed(1)} 小时`,
        s.isActive ? '启用' : '停用',
        s.createdAt,
      ]
    })
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `班次清单_${dayjs().format('YYYYMMDD')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0 }}>
          班次清单
        </Title>
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
          导出 Excel
        </Button>
      </div>

      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          placeholder="所属门店"
          allowClear
          style={{ width: 180 }}
          value={storeFilter}
          onChange={setStoreFilter}
          options={scopedStores.map((s) => ({ label: `${s.storeName} (${s.storeNo})`, value: s.id }))}
        />
        <Select
          placeholder="班次类型"
          mode="multiple"
          allowClear
          style={{ width: 180 }}
          value={typeFilter}
          onChange={setTypeFilter}
          options={companyShiftTypes.map((t) => ({ label: t.typeName, value: t.id }))}
        />
        <Select
          placeholder="状态"
          allowClear
          style={{ width: 100 }}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: '启用', value: '启用' },
            { label: '停用', value: '停用' },
          ]}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleQuery}>
          查询
        </Button>
        <Button icon={<ReloadOutlined />} onClick={handleReset}>
          重置
        </Button>
      </Space>

      <Table
        dataSource={filteredShifts}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 20 }}
        size="small"
      />
    </div>
  )
}
