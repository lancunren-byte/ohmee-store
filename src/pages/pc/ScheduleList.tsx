import React, { useMemo, useState } from 'react'
import { Table, Select, DatePicker, Input, Button, Space, Typography, Tag } from 'antd'
import { DownloadOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { useAppStore } from '../../store'
import dayjs from 'dayjs'

const { Title } = Typography
const { RangePicker } = DatePicker

export default function ScheduleList() {
  const { schedules, shifts, employees, stores, getScopedStores, selectedCompanyId } = useAppStore()
  const [storeFilter, setStoreFilter] = useState<string | undefined>()
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(() => [
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ])
  const [searchText, setSearchText] = useState('')
  const [shiftFilter, setShiftFilter] = useState<string[]>([])
  const [appliedStore, setAppliedStore] = useState<string | undefined>()
  const [appliedDateRange, setAppliedDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(() => [
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ])
  const [appliedSearch, setAppliedSearch] = useState('')
  const [appliedShift, setAppliedShift] = useState<string[]>([])

  const scopedStores = selectedCompanyId ? getScopedStores(selectedCompanyId) : []

  const handleQuery = () => {
    setAppliedStore(storeFilter)
    setAppliedDateRange(dateRange)
    setAppliedSearch(searchText)
    setAppliedShift(shiftFilter)
  }
  const handleReset = () => {
    setStoreFilter(undefined)
    setDateRange([dayjs().startOf('month'), dayjs().endOf('month')])
    setSearchText('')
    setShiftFilter([])
    setAppliedStore(undefined)
    setAppliedDateRange([dayjs().startOf('month'), dayjs().endOf('month')])
    setAppliedSearch('')
    setAppliedShift([])
  }

  const filteredSchedules = useMemo(() => {
    let list = schedules.filter((s) => scopedStores.some((st) => st.id === s.storeId))
    if (appliedStore) list = list.filter((s) => s.storeId === appliedStore)
    if (appliedDateRange) {
      const [start, end] = appliedDateRange
      const startStr = start.format('YYYY-MM-DD')
      const endStr = end.format('YYYY-MM-DD')
      list = list.filter((s) => s.endDate >= startStr && s.startDate <= endStr)
    }
    if (appliedSearch) {
      const lower = appliedSearch.toLowerCase()
      list = list.filter((s) => {
        const emp = employees.find((e) => e.id === s.empId)
        return emp?.name?.toLowerCase().includes(lower) || emp?.empNo?.toLowerCase().includes(lower)
      })
    }
    if (appliedShift.length) list = list.filter((s) => appliedShift.includes(s.shiftId))
    return list
  }, [schedules, scopedStores, appliedStore, appliedDateRange, appliedSearch, appliedShift, employees])

  const storeShifts = useMemo(
    () => shifts.filter((s) => scopedStores.some((st) => st.id === s.storeId) && s.isActive),
    [shifts, scopedStores],
  )

  const getTransferTag = (schedule: { empId: string; storeId: string }) => {
    const emp = employees.find((e) => e.id === schedule.empId)
    const empStore = emp ? stores.find((s) => s.id === emp.storeId) : null
    return empStore?.id !== schedule.storeId
  }

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
      key: 'empStore',
      render: (_: unknown, r: { empId: string }) => {
        const emp = employees.find((e) => e.id === r.empId)
        const st = emp ? stores.find((s) => s.id === emp.storeId) : null
        return st ? `${st.storeName} (${st.storeNo})` : '-'
      },
    },
    {
      title: '排班门店',
      dataIndex: 'storeId',
      key: 'storeId',
      render: (id: string) => {
        const st = stores.find((s) => s.id === id)
        return st ? `${st.storeName} (${st.storeNo})` : '-'
      },
    },
    {
      title: '班次名称',
      dataIndex: 'shiftId',
      key: 'shiftName',
      render: (id: string) => shifts.find((s) => s.id === id)?.shiftName || '-',
    },
    {
      title: '班次类型',
      dataIndex: 'shiftId',
      key: 'shiftType',
      render: (id: string) => {
        const sh = shifts.find((s) => s.id === id)
        return sh ? shifts.find((s) => s.id === id)?.shiftName?.split('·')[0] || '-' : '-'
      },
    },
    { title: '排班开始日期', dataIndex: 'startDate', key: 'startDate' },
    { title: '排班结束日期', dataIndex: 'endDate', key: 'endDate' },
    {
      title: '上班时间',
      key: 'startTime',
      render: (_: unknown, r: { shiftId: string }) => shifts.find((s) => s.id === r.shiftId)?.startTime || '-',
    },
    {
      title: '下班时间',
      key: 'endTime',
      render: (_: unknown, r: { shiftId: string }) => shifts.find((s) => s.id === r.shiftId)?.endTime || '-',
    },
    {
      title: '是否借调',
      key: 'isTransfer',
      render: (_: unknown, r: { empId: string; storeId: string }) =>
        getTransferTag(r) ? <Tag color="orange">是</Tag> : <Tag>否</Tag>,
    },
  ]

  const handleExport = () => {
    const headers = ['员工工号', '员工姓名', '所属门店', '排班门店', '班次名称', '班次类型', '排班开始', '排班结束', '上班时间', '下班时间', '是否借调']
    const rows = filteredSchedules.map((s) => {
      const emp = employees.find((e) => e.id === s.empId)
      const empStore = emp ? stores.find((st) => st.id === emp.storeId) : null
      const store = stores.find((st) => st.id === s.storeId)
      const sh = shifts.find((st) => st.id === s.shiftId)
      return [
        emp?.empNo || '',
        emp?.name || '',
        empStore ? `${empStore.storeName} (${empStore.storeNo})` : '',
        store ? `${store.storeName} (${store.storeNo})` : '',
        sh?.shiftName || '',
        sh?.shiftName?.split('·')[0] || '',
        s.startDate,
        s.endDate,
        sh?.startTime || '',
        sh?.endTime || '',
        getTransferTag(s) ? '是' : '否',
      ]
    })
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `排班清单_${dayjs().format('YYYYMMDD')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0 }}>
          排班清单
        </Title>
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
          导出 Excel
        </Button>
      </div>

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
          options={scopedStores.map((s) => ({ label: `${s.storeName} (${s.storeNo})`, value: s.id }))}
        />
        <Input
          placeholder="员工姓名/工号"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 140 }}
        />
        <Select
          placeholder="班次"
          mode="multiple"
          allowClear
          style={{ width: 180 }}
          value={shiftFilter}
          onChange={setShiftFilter}
          options={storeShifts.map((s) => ({ label: s.shiftName, value: s.id }))}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleQuery}>
          查询
        </Button>
        <Button icon={<ReloadOutlined />} onClick={handleReset}>
          重置
        </Button>
      </Space>

      <Table
        dataSource={filteredSchedules}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 20 }}
        size="small"
      />
    </div>
  )
}
