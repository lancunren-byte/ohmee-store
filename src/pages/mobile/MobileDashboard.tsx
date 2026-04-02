import React, { useState, useMemo } from 'react'
import { Button, DatePicker, Tag, Empty } from 'antd-mobile'
import { FilterOutline } from 'antd-mobile-icons'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'
import StoreSwitcher from '../../components/mobile/StoreSwitcher'
import dayjs from 'dayjs'

export default function MobileDashboard() {
  const navigate = useNavigate()
  const {
    currentUser,
    employees,
    schedules,
    attendances,
    shifts,
    stores,
    transfers,
    supervisorViewStoreId,
    setSupervisorViewStoreId,
  } = useAppStore()

  const today = dayjs()
  const [startDate, setStartDate] = useState<Date>(today.startOf('month').toDate())
  const [endDate, setEndDate] = useState<Date>(today.toDate())
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)

  if (!currentUser) {
    navigate('/mobile/login')
    return null
  }

  const storeId =
    currentUser.role === '督导' && supervisorViewStoreId
      ? supervisorViewStoreId
      : currentUser.storeId
  const store = stores.find((s) => s.id === storeId)

  const startStr = dayjs(startDate).format('YYYY-MM-DD')
  const endStr = dayjs(endDate).format('YYYY-MM-DD')

  const storeEmployees = employees.filter((e) => e.storeId === storeId && e.isActive)

  const approvedTransfers = transfers.filter(
    (t) =>
      t.toStoreId === storeId &&
      t.status === '已批准' &&
      t.startDate <= endStr &&
      t.endDate >= startStr,
  )
  const transferredInEmps = approvedTransfers
    .map((t) => employees.find((e) => e.id === t.empId))
    .filter(Boolean)

  const allEmployees = [
    ...storeEmployees,
    ...transferredInEmps.filter(
      (e) => e && !storeEmployees.find((se) => se.id === e?.id),
    ),
  ].filter(Boolean)

  const getDateRange = () => {
    const days: string[] = []
    let cur = dayjs(startDate)
    const end = dayjs(endDate)
    while (cur.isBefore(end) || cur.isSame(end, 'day')) {
      days.push(cur.format('YYYY-MM-DD'))
      cur = cur.add(1, 'day')
    }
    return days
  }

  const dateRange = getDateRange()

  const employeeStats = useMemo(() => {
    return allEmployees.map((emp) => {
      if (!emp) return null
      const isTransferred = transferredInEmps.some((t) => t?.id === emp.id)

      const scheduledDates = dateRange.filter((d) => {
        return schedules.some(
          (s) =>
            s.empId === emp.id &&
            s.startDate <= d &&
            s.endDate >= d,
        )
      })

      const empAttendances = attendances.filter(
        (a) =>
          a.empId === emp.id &&
          a.date >= startStr &&
          a.date <= endStr,
      )

      const normalCount = empAttendances.filter((a) => a.status === '正常').length
      const lateCount = empAttendances.filter(
        (a) => a.status === '迟到' || a.status === '迟到早退',
      ).length
      const earlyCount = empAttendances.filter(
        (a) => a.status === '早退' || a.status === '迟到早退',
      ).length
      const absentCount = empAttendances.filter(
        (a) => a.status === '缺勤' || a.status === '未打卡',
      ).length
      const checkedCount = empAttendances.filter(
        (a) => a.checkInTime || a.checkOutTime,
      ).length

      const abnormalCount = lateCount + earlyCount + absentCount
      const abnormalReasons: string[] = []
      if (lateCount > 0) abnormalReasons.push(`迟到${lateCount}次`)
      if (earlyCount > 0) abnormalReasons.push(`早退${earlyCount}次`)
      if (absentCount > 0) abnormalReasons.push(`缺勤${absentCount}次`)

      return {
        emp,
        isTransferred,
        scheduledCount: scheduledDates.length,
        checkedCount,
        normalCount,
        abnormalCount,
        abnormalReasons,
        attendances: empAttendances,
      }
    }).filter(Boolean)
  }, [allEmployees, dateRange, schedules, attendances, startStr, endStr])

  const summaryStats = useMemo(() => {
    const total = employeeStats.reduce((acc, s) => acc + (s?.checkedCount || 0), 0)
    const normal = employeeStats.reduce((acc, s) => acc + (s?.normalCount || 0), 0)
    const abnormal = employeeStats.reduce((acc, s) => acc + (s?.abnormalCount || 0), 0)
    return { total, normal, abnormal }
  }, [employeeStats])

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: 80 }}>
      <div
        style={{
          background: 'linear-gradient(145deg, #ff3b30 0%, #e6232a 55%, #a61010 100%)',
          padding: '16px 16px 24px',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>打卡看板</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{store?.storeName}</div>
          </div>
          <StoreSwitcher value={storeId} onChange={setSupervisorViewStoreId} />
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          {[
            { label: '总打卡', value: summaryStats.total, color: '#fff' },
            { label: '正常', value: summaryStats.normal, color: '#73d13d' },
            { label: '异常', value: summaryStats.abnormal, color: '#ff7875' },
            { label: '员工数', value: allEmployees.length, color: '#69b1ff' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: '16px 16px 0 0',
          marginTop: -12,
          padding: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <FilterOutline style={{ color: '#1677ff' }} />
          <span style={{ fontSize: 13, color: '#666' }}>日期范围：</span>
          <Button
            size="small"
            fill="outline"
            onClick={() => setShowStartPicker(true)}
          >
            {dayjs(startDate).format('MM-DD')}
          </Button>
          <span style={{ color: '#999' }}>—</span>
          <Button
            size="small"
            fill="outline"
            onClick={() => setShowEndPicker(true)}
          >
            {dayjs(endDate).format('MM-DD')}
          </Button>
          <Button
            size="small"
            color="primary"
            fill="none"
            onClick={() => {
              setStartDate(today.startOf('month').toDate())
              setEndDate(today.toDate())
            }}
          >
            本月
          </Button>
        </div>

        {employeeStats.length === 0 ? (
          <Empty description="本店暂无员工数据" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th
                    style={{
                      padding: '10px 8px',
                      textAlign: 'left',
                      fontWeight: 600,
                      borderBottom: '1px solid #f0f0f0',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    姓名
                  </th>
                  <th
                    style={{
                      padding: '10px 8px',
                      textAlign: 'center',
                      fontWeight: 600,
                      borderBottom: '1px solid #f0f0f0',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    班次
                  </th>
                  <th
                    style={{
                      padding: '10px 8px',
                      textAlign: 'center',
                      fontWeight: 600,
                      borderBottom: '1px solid #f0f0f0',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    应打
                  </th>
                  <th
                    style={{
                      padding: '10px 8px',
                      textAlign: 'center',
                      fontWeight: 600,
                      borderBottom: '1px solid #f0f0f0',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    正常
                  </th>
                  <th
                    style={{
                      padding: '10px 8px',
                      textAlign: 'center',
                      fontWeight: 600,
                      borderBottom: '1px solid #f0f0f0',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    异常
                  </th>
                  <th
                    style={{
                      padding: '10px 8px',
                      textAlign: 'left',
                      fontWeight: 600,
                      borderBottom: '1px solid #f0f0f0',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    异常原因
                  </th>
                </tr>
              </thead>
              <tbody>
                {employeeStats.map((stat) => {
                  if (!stat) return null
                  const { emp, isTransferred, scheduledCount, normalCount, abnormalCount, abnormalReasons } = stat
                  return (
                    <tr
                      key={emp.id}
                      style={{ borderBottom: '1px solid #f9f9f9' }}
                    >
                      <td style={{ padding: '12px 8px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 500 }}>{emp.name}</div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                          <span
                            style={{
                              fontSize: 11,
                              color: '#fff',
                              background: '#1677ff',
                              padding: '1px 5px',
                              borderRadius: 4,
                            }}
                          >
                            {emp.role}
                          </span>
                          {isTransferred && (
                            <span
                              style={{
                                fontSize: 11,
                                color: '#fff',
                                background: '#fa8c16',
                                padding: '1px 5px',
                                borderRadius: 4,
                              }}
                            >
                              借调
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', color: '#666' }}>
                        {(() => {
                          const sc = schedules.find((s) => s.empId === emp.id)
                          if (!sc) return '-'
                          const sh = shifts.find((s) => s.id === sc.shiftId)
                          return sh ? `${sh.startTime}-${sh.endTime}` : '-'
                        })()}
                      </td>
                      <td
                        style={{
                          padding: '12px 8px',
                          textAlign: 'center',
                          fontWeight: 600,
                          color: '#333',
                        }}
                      >
                        {scheduledCount}
                      </td>
                      <td
                        style={{
                          padding: '12px 8px',
                          textAlign: 'center',
                          color: '#52c41a',
                          fontWeight: 600,
                        }}
                      >
                        {normalCount}
                      </td>
                      <td
                        style={{
                          padding: '12px 8px',
                          textAlign: 'center',
                          color: abnormalCount > 0 ? '#ff4d4f' : '#999',
                          fontWeight: 600,
                        }}
                      >
                        {abnormalCount}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {abnormalReasons.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {abnormalReasons.map((r) => (
                              <Tag
                                key={r}
                                color="danger"
                                fill="outline"
                                style={{ fontSize: 11 }}
                              >
                                {r}
                              </Tag>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#999', fontSize: 12 }}>-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DatePicker
        visible={showStartPicker}
        onClose={() => setShowStartPicker(false)}
        onConfirm={(val) => {
          setStartDate(val)
          setShowStartPicker(false)
        }}
        title="选择开始日期"
        max={new Date()}
      />
      <DatePicker
        visible={showEndPicker}
        onClose={() => setShowEndPicker(false)}
        onConfirm={(val) => {
          setEndDate(val)
          setShowEndPicker(false)
        }}
        title="选择结束日期"
        min={startDate}
        max={new Date()}
      />
    </div>
  )
}
