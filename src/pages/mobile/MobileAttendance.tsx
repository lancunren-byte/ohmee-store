import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Toast } from 'antd-mobile'
import { LeftOutline, RightOutline } from 'antd-mobile-icons'
import { useAppStore } from '../../store'
import dayjs from 'dayjs'
import { getAttendanceStatusColor } from '../../utils/helpers'

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

export default function MobileAttendance() {
  const navigate = useNavigate()
  const { currentUser, schedules, attendances, shifts, shiftTypes, stores } = useAppStore()
  const [currentMonth, setCurrentMonth] = useState(dayjs())

  if (!currentUser) {
    navigate('/mobile/login')
    return null
  }

  const store = stores.find((s) => s.id === currentUser.storeId)
  const year = currentMonth.year()
  const month = currentMonth.month()
  const daysInMonth = currentMonth.daysInMonth()
  const firstDay = currentMonth.startOf('month').day()

  const mySchedules = schedules.filter((s) => s.empId === currentUser.id)

  const getScheduleForDate = (dateStr: string) => {
    return mySchedules.find((s) => s.startDate <= dateStr && s.endDate >= dateStr)
  }

  const getShiftShortName = (scheduleId: string) => {
    const schedule = mySchedules.find((s) => s.id === scheduleId)
    if (!schedule) return ''
    const shift = shifts.find((s) => s.id === schedule.shiftId)
    if (!shift) return ''
    const type = shiftTypes.find((t) => t.id === shift.typeId)
    return type?.typeName || shift.shiftName || ''
  }

  const getAttendanceForDate = (dateStr: string) => {
    return attendances.find((a) => a.empId === currentUser.id && a.date === dateStr)
  }

  const calendarDays = useMemo(() => {
    const days: Array<{ date: string | null; day: number | null }> = []
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: null, day: null })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = currentMonth.date(d).format('YYYY-MM-DD')
      days.push({ date, day: d })
    }
    return days
  }, [year, month, firstDay, daysInMonth])

  const handleDayClick = (dateStr: string) => {
    const schedule = getScheduleForDate(dateStr)
    if (!schedule) {
      Toast.show({ content: '该日期无排班', icon: 'fail' })
      return
    }
    navigate(`/mobile/checkin?date=${dateStr}&scheduleId=${schedule.id}`)
  }

  const today = dayjs().format('YYYY-MM-DD')

  const getDayStatus = (dateStr: string) => {
    const schedule = getScheduleForDate(dateStr)
    if (!schedule) return null
    const attendance = getAttendanceForDate(dateStr)
    if (attendance) return attendance.status
    if (dateStr < today) return '未打卡'
    return 'scheduled'
  }

  const getDayBgColor = (status: string | null) => {
    if (!status) return 'transparent'
    if (status === 'scheduled') return '#e6f4ff'
    const colors: Record<string, string> = {
      正常: '#f6ffed',
      迟到: '#fffbe6',
      早退: '#fffbe6',
      迟到早退: '#fffbe6',
      缺勤: '#fff1f0',
      未打卡: '#fff1f0',
    }
    return colors[status] || 'transparent'
  }

  const getDayDotColor = (status: string | null) => {
    if (!status) return 'transparent'
    if (status === 'scheduled') return '#1890ff'
    const colors: Record<string, string> = {
      正常: '#52c41a',
      迟到: '#faad14',
      早退: '#faad14',
      迟到早退: '#faad14',
      缺勤: '#ff4d4f',
      未打卡: '#ff4d4f',
    }
    return colors[status] || 'transparent'
  }

  const stats = useMemo(() => {
    const monthStart = currentMonth.startOf('month').format('YYYY-MM-DD')
    const monthEnd = currentMonth.endOf('month').format('YYYY-MM-DD')
    const monthAttendances = attendances.filter(
      (a) => a.empId === currentUser.id && a.date >= monthStart && a.date <= monthEnd,
    )
    return {
      total: monthAttendances.length,
      normal: monthAttendances.filter((a) => a.status === '正常').length,
      late: monthAttendances.filter((a) => a.status === '迟到' || a.status === '迟到早退').length,
      early: monthAttendances.filter((a) => a.status === '早退' || a.status === '迟到早退').length,
      absent: monthAttendances.filter((a) => a.status === '缺勤' || a.status === '未打卡').length,
    }
  }, [currentMonth, attendances, currentUser.id])

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: 80 }}>
      <div
        style={{
          background: 'linear-gradient(145deg, #ff3b30 0%, #e6232a 55%, #a61010 100%)',
          padding: '16px 16px 24px',
          color: '#fff',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
          {currentUser.name} 的打卡记录
        </div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>{store?.storeName}</div>

        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          {[
            { label: '正常', value: stats.normal, color: '#52c41a' },
            { label: '迟到', value: stats.late, color: '#faad14' },
            { label: '早退', value: stats.early, color: '#fa8c16' },
            { label: '缺勤', value: stats.absent, color: '#ff4d4f' },
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
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <Button
            fill="none"
            size="small"
            onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
          >
            <LeftOutline />
          </Button>
          <span style={{ fontWeight: 600, fontSize: 16 }}>
            {currentMonth.format('YYYY年MM月')}
          </span>
          <Button
            fill="none"
            size="small"
            onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
            disabled={currentMonth.format('YYYY-MM') >= dayjs().format('YYYY-MM')}
          >
            <RightOutline />
          </Button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 4,
            marginBottom: 8,
          }}
        >
          {weekDays.map((d) => (
            <div
              key={d}
              style={{
                textAlign: 'center',
                fontSize: 12,
                color: '#999',
                padding: '4px 0',
              }}
            >
              {d}
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 4,
          }}
        >
          {calendarDays.map((item, idx) => {
            if (!item.date) {
              return <div key={`empty-${idx}`} />
            }
            const status = getDayStatus(item.date)
            const isToday = item.date === today
            const isFuture = item.date > today
            return (
              <div
                key={item.date}
                onClick={() => !isFuture && handleDayClick(item.date!)}
                style={{
                  textAlign: 'center',
                  padding: '8px 4px',
                  borderRadius: 8,
                  background: getDayBgColor(status),
                  border: isToday ? '2px solid #e6232a' : '1px solid transparent',
                  cursor: isFuture ? 'default' : 'pointer',
                  position: 'relative',
                  opacity: isFuture ? 0.4 : 1,
                  transition: 'all 0.15s',
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: isToday ? 700 : 400,
                    color: isToday ? '#e6232a' : '#333',
                  }}
                >
                  {item.day}
                </div>
                {status && (
                  <>
                    <div
                      style={{
                        fontSize: 10,
                        color: '#666',
                        marginTop: 5,
                        lineHeight: 1.1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {getShiftShortName(getScheduleForDate(item.date)?.id || '')}
                    </div>
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: getDayDotColor(status),
                        margin: '2px auto 0',
                      }}
                    />
                  </>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: '已排班', color: '#1890ff', bg: '#e6f4ff' },
            { label: '正常', color: '#52c41a', bg: '#f6ffed' },
            { label: '迟到/早退', color: '#faad14', bg: '#fffbe6' },
            { label: '缺勤', color: '#ff4d4f', bg: '#fff1f0' },
            { label: '未打卡', color: '#999', bg: '#f5f5f5' },
          ].map(({ label, color, bg }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 12, color: '#666' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
