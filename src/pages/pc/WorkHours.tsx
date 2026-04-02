import React, { useMemo, useState } from 'react'
import { Table, Select, DatePicker, Input, Button, Space, Typography, Tag, Card, Row, Col } from 'antd'
import { DownloadOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { useAppStore } from '../../store'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

function calcHours(
  startTime: string,
  endTime: string,
  checkIn?: string,
  checkOut?: string,
  status?: string,
): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const planH = eh - sh + (em - sm) / 60
  const plan = planH < 0 ? planH + 24 : planH

  if (status === '缺勤' || status === '未打卡') return 0
  if (!checkIn || !checkOut) return 0

  const [cih, cim] = checkIn.split(':').map(Number)
  const [coh, com] = checkOut.split(':').map(Number)
  const actualH = coh - cih + (com - cim) / 60
  const actual = actualH < 0 ? actualH + 24 : actualH

  if (status === '正常') return plan
  if (status === '迟到') return Math.max(0, plan - (cih * 60 + cim - sh * 60 - sm) / 60)
  if (status === '早退') return Math.max(0, plan - (eh * 60 + em - coh * 60 - com) / 60)
  if (status === '迟到早退') return actual
  return actual
}

export default function WorkHours() {
  const { schedules, shifts, employees, stores, attendances, getScopedStores, selectedCompanyId } = useAppStore()
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(() => [
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ])
  const [storeFilter, setStoreFilter] = useState<string | undefined>()
  const [searchText, setSearchText] = useState('')
  const [roleFilter, setRoleFilter] = useState<string[]>([])
  const [appliedDateRange, setAppliedDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(() => [
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ])
  const [appliedStore, setAppliedStore] = useState<string | undefined>()
  const [appliedSearch, setAppliedSearch] = useState('')
  const [appliedRole, setAppliedRole] = useState<string[]>([])

  const scopedStores = selectedCompanyId ? getScopedStores(selectedCompanyId) : []

  const handleQuery = () => {
    setAppliedDateRange(dateRange)
    setAppliedStore(storeFilter)
    setAppliedSearch(searchText)
    setAppliedRole(roleFilter)
  }
  const handleReset = () => {
    setDateRange([dayjs().startOf('month'), dayjs().endOf('month')])
    setStoreFilter(undefined)
    setSearchText('')
    setRoleFilter([])
    setAppliedDateRange([dayjs().startOf('month'), dayjs().endOf('month')])
    setAppliedStore(undefined)
    setAppliedSearch('')
    setAppliedRole([])
  }
  const scopedEmployees = selectedCompanyId
    ? employees.filter((e) => e.companyId === selectedCompanyId && e.isActive)
    : []

  const { summary, rows } = useMemo(() => {
    const [start, end] = appliedDateRange || [dayjs().startOf('month'), dayjs().endOf('month')]
    const startStr = start.format('YYYY-MM-DD')
    const endStr = end.format('YYYY-MM-DD')

    let schedList = schedules.filter(
      (s) =>
        scopedStores.some((st) => st.id === s.storeId) &&
        s.endDate >= startStr &&
        s.startDate <= endStr,
    )
    if (appliedStore) schedList = schedList.filter((s) => s.storeId === appliedStore)
    if (appliedSearch) {
      const lower = appliedSearch.toLowerCase()
      schedList = schedList.filter((s) => {
        const emp = employees.find((e) => e.id === s.empId)
        return emp?.name?.toLowerCase().includes(lower) || emp?.empNo?.toLowerCase().includes(lower)
      })
    }
    if (appliedRole.length) {
      schedList = schedList.filter((s) => {
        const emp = employees.find((e) => e.id === s.empId)
        return emp && appliedRole.includes(emp.role)
      })
    }

    const empIds = [...new Set(schedList.map((s) => s.empId))]
    const roleSet = new Set(appliedRole)
    const filteredEmps = appliedRole.length
      ? empIds.filter((id) => {
          const e = employees.find((x) => x.id === id)
          return e && roleSet.has(e.role)
        })
      : empIds

    let totalPlan = 0
    let totalActual = 0
    let absentCount = 0

    const rowMap = new Map<
      string,
      {
        empId: string
        empNo: string
        name: string
        storeName: string
        scheduleDays: number
        attendDays: number
        lateCount: number
        earlyCount: number
        absentCount: number
        planHours: number
        actualHours: number
        diffHours: number
      }
    >()

    for (const empId of filteredEmps) {
      const emp = employees.find((e) => e.id === empId)
      if (!emp) continue
      const store = stores.find((s) => s.id === emp.storeId)
      const empScheds = schedList.filter((s) => s.empId === empId)
      let planHours = 0
      let actualHours = 0
      let lateCount = 0
      let earlyCount = 0
      let absentCountEmp = 0

      for (const sched of empScheds) {
        const shift = shifts.find((sh) => sh.id === sched.shiftId)
        if (!shift) continue
        const [sh, sm] = shift.startTime.split(':').map(Number)
        const [eh, em] = shift.endTime.split(':').map(Number)
        let h = eh - sh + (em - sm) / 60
        if (h < 0) h += 24
        planHours += h

        const fromDate = sched.startDate > startStr ? sched.startDate : startStr
        const toDate = sched.endDate < endStr ? sched.endDate : endStr
        let d = fromDate
        while (d <= toDate) {
          const att = attendances.find(
            (a) => a.empId === empId && a.date === d && a.scheduleId === sched.id,
          )
          const status = att?.status || '缺勤'
          if (status === '缺勤' || status === '未打卡') absentCountEmp++
          if (status === '迟到' || status === '迟到早退') lateCount++
          if (status === '早退' || status === '迟到早退') earlyCount++
          actualHours += calcHours(
            shift.startTime,
            shift.endTime,
            att?.checkInTime,
            att?.checkOutTime,
            status,
          )
          d = dayjs(d).add(1, 'day').format('YYYY-MM-DD')
        }
      }

      totalPlan += planHours
      totalActual += actualHours
      absentCount += absentCountEmp

      const attendDays = empScheds.reduce((acc, s) => {
        let c = 0
        const fromD = s.startDate > startStr ? s.startDate : startStr
        const endD = s.endDate < endStr ? s.endDate : endStr
        let d = fromD
        while (d <= endD) {
          if (attendances.some((a) => a.empId === empId && a.date === d && a.scheduleId === s.id)) c++
          d = dayjs(d).add(1, 'day').format('YYYY-MM-DD')
        }
        return acc + c
      }, 0)

      rowMap.set(empId, {
        empId,
        empNo: emp.empNo,
        name: emp.name,
        storeName: store?.storeName || '-',
        scheduleDays: empScheds.reduce((acc, s) => {
          const from = s.startDate > startStr ? s.startDate : startStr
          const to = s.endDate < endStr ? s.endDate : endStr
          return acc + Math.max(0, dayjs(to).diff(dayjs(from), 'day') + 1)
        }, 0),
        attendDays,
        lateCount,
        earlyCount,
        absentCount: absentCountEmp,
        planHours,
        actualHours,
        diffHours: actualHours - planHours,
      })
    }

    const rows = Array.from(rowMap.values())
    const rate = totalPlan > 0 ? ((totalActual / totalPlan) * 100).toFixed(1) : '0'

    return {
      summary: {
        totalPlan,
        totalActual,
        rate,
        absentCount,
      },
      rows,
    }
  }, [
    appliedDateRange,
    schedules,
    shifts,
    employees,
    stores,
    attendances,
    scopedStores,
    appliedStore,
    appliedSearch,
    appliedRole,
  ])

  const columns = [
    { title: '员工工号', dataIndex: 'empNo', key: 'empNo' },
    { title: '员工姓名', dataIndex: 'name', key: 'name' },
    { title: '所属门店', dataIndex: 'storeName', key: 'storeName' },
    { title: '排班天数', dataIndex: 'scheduleDays', key: 'scheduleDays' },
    { title: '实出勤天数', dataIndex: 'attendDays', key: 'attendDays' },
    { title: '迟到次数', dataIndex: 'lateCount', key: 'lateCount' },
    { title: '早退次数', dataIndex: 'earlyCount', key: 'earlyCount' },
    { title: '缺勤次数', dataIndex: 'absentCount', key: 'absentCount' },
    {
      title: '计划工时(h)',
      dataIndex: 'planHours',
      key: 'planHours',
      render: (v: number) => v.toFixed(1),
    },
    {
      title: '实际工时(h)',
      dataIndex: 'actualHours',
      key: 'actualHours',
      render: (v: number) => v.toFixed(1),
    },
    {
      title: '工时差(h)',
      dataIndex: 'diffHours',
      key: 'diffHours',
      render: (v: number) => (
        <span style={{ color: v < 0 ? '#ff4d4f' : undefined }}>{v.toFixed(1)}</span>
      ),
    },
  ]

  const handleExport = () => {
    const headers = ['员工工号', '员工姓名', '所属门店', '排班天数', '实出勤天数', '迟到次数', '早退次数', '缺勤次数', '计划工时(h)', '实际工时(h)', '工时差(h)']
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        [r.empNo, r.name, r.storeName, r.scheduleDays, r.attendDays, r.lateCount, r.earlyCount, r.absentCount, r.planHours.toFixed(1), r.actualHours.toFixed(1), r.diffHours.toFixed(1)].join(','),
      ),
    ].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `工时统计_${dayjs().format('YYYYMMDD')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const roleOptions = [...new Set(scopedEmployees.map((e) => e.role))].map((r) => ({ label: r, value: r }))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0 }}>
          工时统计
        </Title>
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
          导出 Excel
        </Button>
      </div>

      <Space wrap style={{ marginBottom: 16 }}>
        <Button onClick={() => setDateRange([dayjs().startOf('month'), dayjs().endOf('month')])}>本月</Button>
        <Button onClick={() => setDateRange([dayjs().startOf('week'), dayjs().endOf('week')])}>本周</Button>
        <RangePicker value={dateRange} onChange={(v) => setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null)} />
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
          placeholder="角色"
          mode="multiple"
          allowClear
          style={{ width: 160 }}
          value={roleFilter}
          onChange={setRoleFilter}
          options={roleOptions}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleQuery}>
          查询
        </Button>
        <Button icon={<ReloadOutlined />} onClick={handleReset}>
          重置
        </Button>
      </Space>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Text type="secondary">总计划工时</Text>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{summary.totalPlan.toFixed(1)} h</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Text type="secondary">总实际工时</Text>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{summary.totalActual.toFixed(1)} h</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Text type="secondary">工时达成率</Text>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{summary.rate}%</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Text type="secondary">缺勤总次数</Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: summary.absentCount > 0 ? '#ff4d4f' : undefined }}>
              {summary.absentCount}
            </div>
          </Card>
        </Col>
      </Row>

      <div style={{ background: '#fffbe6', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 12, color: '#856404' }}>
        <strong>工时计算规则：</strong>正常=班次时长；迟到=下班时间-上班打卡时间；早退=下班打卡时间-上班时间；迟到+早退=实际时长；缺勤=0
      </div>

      <Table dataSource={rows} columns={columns} rowKey="empId" pagination={{ pageSize: 20 }} size="small" />
    </div>
  )
}
