import React, { useMemo, useState } from 'react'
import { Table, Select, DatePicker, Input, Button, Space, Typography } from 'antd'
import { DownloadOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { useAppStore } from '../../store'
import dayjs from 'dayjs'

const { Title } = Typography
const { RangePicker } = DatePicker

export default function AttendanceExport() {
  const { attendances, schedules, shifts, employees, stores, shiftTypes, getScopedStores, selectedCompanyId } =
    useAppStore()
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(() => [
    dayjs().startOf('month'),
    dayjs(),
  ])
  const [storeFilter, setStoreFilter] = useState<string | undefined>()
  const [searchText, setSearchText] = useState('')
  const [shiftTypeFilter, setShiftTypeFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [searched, setSearched] = useState(true)

  const scopedStores = selectedCompanyId ? getScopedStores(selectedCompanyId) : []

  const filteredData = useMemo(() => {
    if (!searched && !dateRange) return []
    const [start, end] = dateRange || [dayjs().startOf('month'), dayjs()]
    const startStr = start.format('YYYY-MM-DD')
    const endStr = end.format('YYYY-MM-DD')

    let list = attendances.filter((a) => a.date >= startStr && a.date <= endStr)
    list = list.filter((a) => scopedStores.some((s) => s.id === a.storeId))

    if (storeFilter) list = list.filter((a) => a.storeId === storeFilter)
    if (searchText) {
      const lower = searchText.toLowerCase()
      list = list.filter((a) => {
        const emp = employees.find((e) => e.id === a.empId)
        return emp?.name?.toLowerCase().includes(lower) || emp?.empNo?.toLowerCase().includes(lower)
      })
    }
    if (shiftTypeFilter.length) {
      list = list.filter((a) => {
        const sh = shifts.find((s) => s.id === a.shiftId)
        return sh && shiftTypeFilter.includes(sh.typeId)
      })
    }
    if (statusFilter.length) list = list.filter((a) => statusFilter.includes(a.status))

    return list.slice(0, 10000) // 单次导出上限 10000
  }, [
    attendances,
    dateRange,
    storeFilter,
    searchText,
    shiftTypeFilter,
    statusFilter,
    scopedStores,
    employees,
    shifts,
    searched,
  ])

  const companyShiftTypes = useMemo(
    () => shiftTypes.filter((st) => scopedStores.some((s) => s.companyId === st.companyId) && st.isActive),
    [shiftTypes, scopedStores],
  )

  const columns = [
    {
      title: '员工工号',
      key: 'empNo',
      render: (_: unknown, r: { empId: string }) => employees.find((e) => e.id === r.empId)?.empNo || '-',
    },
    {
      title: '员工姓名',
      key: 'empName',
      render: (_: unknown, r: { empId: string }) => employees.find((e) => e.id === r.empId)?.name || '-',
    },
    {
      title: '所属门店',
      dataIndex: 'storeId',
      key: 'storeId',
      render: (id: string) => stores.find((s) => s.id === id)?.storeName || '-',
    },
    {
      title: '班次类型',
      key: 'shiftType',
      render: (_: unknown, r: { shiftId: string }) => {
        const sh = shifts.find((s) => s.id === r.shiftId)
        return sh ? shiftTypes.find((t) => t.id === sh.typeId)?.typeName || '-' : '-'
      },
    },
    {
      title: '班次名称',
      dataIndex: 'shiftId',
      key: 'shiftName',
      render: (id: string) => shifts.find((s) => s.id === id)?.shiftName || '-',
    },
    { title: '排班日期', dataIndex: 'date', key: 'date' },
    {
      title: '应上班时间',
      key: 'planStart',
      render: (_: unknown, r: { shiftId: string }) => shifts.find((s) => s.id === r.shiftId)?.startTime || '-',
    },
    {
      title: '应下班时间',
      key: 'planEnd',
      render: (_: unknown, r: { shiftId: string }) => shifts.find((s) => s.id === r.shiftId)?.endTime || '-',
    },
    { title: '上班打卡时间', dataIndex: 'checkInTime', key: 'checkInTime', render: (v: string) => v || '—' },
    { title: '下班打卡时间', dataIndex: 'checkOutTime', key: 'checkOutTime', render: (v: string) => v || '—' },
    {
      title: '打卡状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <span style={{ color: v === '正常' ? '#52c41a' : v === '缺勤' || v === '未打卡' ? '#ff4d4f' : '#fa8c16' }}>
          {v}
        </span>
      ),
    },
    { title: '打卡地点', key: 'location', render: () => '-' },
  ]

  const handleQuery = () => setSearched(true)
  const handleReset = () => {
    setDateRange([dayjs().startOf('month'), dayjs()])
    setStoreFilter(undefined)
    setSearchText('')
    setShiftTypeFilter([])
    setStatusFilter([])
    setSearched(true)
  }
  const handleExport = () => {
    const headers = [
      '员工工号',
      '员工姓名',
      '所属门店',
      '班次类型',
      '班次名称',
      '排班日期',
      '应上班时间',
      '应下班时间',
      '上班打卡时间',
      '下班打卡时间',
      '打卡状态',
      '打卡地点',
    ]
    const rows = filteredData.map((r) => {
      const emp = employees.find((e) => e.id === r.empId)
      const store = stores.find((s) => s.id === r.storeId)
      const sh = shifts.find((s) => s.id === r.shiftId)
      const type = sh ? shiftTypes.find((t) => t.id === sh.typeId) : null
      return [
        emp?.empNo || '',
        emp?.name || '',
        store?.storeName || '',
        type?.typeName || '',
        sh?.shiftName || '',
        r.date,
        sh?.startTime || '',
        sh?.endTime || '',
        r.checkInTime || '—',
        r.checkOutTime || '—',
        r.status,
        '-',
      ]
    })
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `打卡记录_${dayjs().format('YYYYMMDD')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <Title level={5} style={{ marginBottom: 16 }}>
        打卡数据导出
      </Title>

      <Space wrap style={{ marginBottom: 16 }}>
        <RangePicker
          value={dateRange}
          onChange={(v) => setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null)}
        />
        <Select
          placeholder="所属门店"
          allowClear
          style={{ width: 180 }}
          value={storeFilter}
          onChange={setStoreFilter}
          options={scopedStores.map((s) => ({ label: s.storeName, value: s.id }))}
        />
        <Input
          placeholder="员工姓名/工号"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 140 }}
        />
        <Select
          placeholder="班次类型"
          mode="multiple"
          allowClear
          style={{ width: 140 }}
          value={shiftTypeFilter}
          onChange={setShiftTypeFilter}
          options={companyShiftTypes.map((t) => ({ label: t.typeName, value: t.id }))}
        />
        <Select
          placeholder="打卡状态"
          mode="multiple"
          allowClear
          style={{ width: 160 }}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: '正常', value: '正常' },
            { label: '迟到', value: '迟到' },
            { label: '早退', value: '早退' },
            { label: '迟到早退', value: '迟到早退' },
            { label: '缺勤', value: '缺勤' },
            { label: '未打卡', value: '未打卡' },
          ]}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleQuery}>
          查询
        </Button>
        <Button icon={<ReloadOutlined />} onClick={handleReset}>
          重置
        </Button>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExport}
          disabled={filteredData.length === 0}
        >
          导出 Excel
        </Button>
      </Space>

      {filteredData.length > 0 && (
        <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>
          共 {filteredData.length} 条记录（单次导出上限 10,000 条）
        </div>
      )}

      <Table
        dataSource={filteredData}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 20 }}
        size="small"
      />
    </div>
  )
}
