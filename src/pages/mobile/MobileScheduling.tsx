import React, { useState } from 'react'
import {
  NavBar,
  Button,
  Form,
  Selector,
  Picker,
  DatePicker,
  Toast,
  Dialog,
  List,
  Tag,
  Empty,
  SwipeAction,
  Space,
} from 'antd-mobile'
import { AddCircleOutline } from 'antd-mobile-icons'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'
import { Schedule } from '../../types'
import { isApiMode, apiCreateSchedule, apiDeleteSchedule } from '../../api/client'
import StoreSwitcher from '../../components/mobile/StoreSwitcher'
import dayjs from 'dayjs'

export default function MobileScheduling() {
  const navigate = useNavigate()
  const {
    currentUser,
    employees,
    shifts,
    schedules,
    transfers,
    stores,
    addSchedule,
    addScheduleFromApi,
    deleteSchedule,
    supervisorViewStoreId,
    setSupervisorViewStoreId,
  } = useAppStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [form] = Form.useForm()
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [showStartDate, setShowStartDate] = useState(false)
  const [showEndDate, setShowEndDate] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  const handleQuery = () => setAppliedSearch(searchText)
  const handleReset = () => { setSearchText(''); setAppliedSearch('') }

  if (!currentUser || (currentUser.role !== '店长' && currentUser.role !== '督导')) {
    return (
      <div style={{ padding: 24, textAlign: 'center', marginTop: 80 }}>
        <Empty description="仅店长可操作排班管理" />
        <Button color="primary" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>
          返回
        </Button>
      </div>
    )
  }

  const storeId =
    currentUser.role === '督导' && supervisorViewStoreId
      ? supervisorViewStoreId
      : currentUser.storeId
  const store = stores.find((s) => s.id === storeId)

  const storeEmployees = employees.filter((e) => e.storeId === storeId && e.isActive)

  const today = dayjs().format('YYYY-MM-DD')
  const approvedTransfers = transfers.filter(
    (t) =>
      t.toStoreId === storeId &&
      t.status === '已批准' &&
      t.startDate <= today &&
      t.endDate >= today,
  )
  const transferredInEmps = approvedTransfers
    .map((t) => employees.find((e) => e.id === t.empId))
    .filter(Boolean)

  const availableEmployees = [
    ...storeEmployees,
    ...transferredInEmps.filter((e) => e && !storeEmployees.find((se) => se.id === e?.id)),
  ].filter(Boolean)

  const storeShifts = shifts.filter((s) => s.storeId === storeId && s.isActive)

  const storeSchedules = schedules.filter((s) => s.storeId === storeId)
  const filteredSchedules = appliedSearch
    ? storeSchedules.filter((s) => {
        const emp = employees.find((e) => e.id === s.empId)
        return emp && (
          emp.name.toLowerCase().includes(appliedSearch.toLowerCase()) ||
          (emp.empNo || '').toLowerCase().includes(appliedSearch.toLowerCase())
        )
      })
    : storeSchedules

  const getEmpName = (empId: string) =>
    employees.find((e) => e.id === empId)?.name || '未知'

  const getShiftInfo = (shiftId: string) => {
    const shift = shifts.find((s) => s.id === shiftId)
    return shift ? `${shift.shiftName} (${shift.startTime}-${shift.endTime})` : '未知班次'
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (!startDate) {
        Toast.show({ content: '请选择开始日期', icon: 'fail' })
        return
      }
      if (!endDate) {
        Toast.show({ content: '请选择结束日期', icon: 'fail' })
        return
      }
      if (dayjs(endDate).isBefore(dayjs(startDate))) {
        Toast.show({ content: '结束日期不能早于开始日期', icon: 'fail' })
        return
      }

      const payload = {
        shiftId: values.shiftId[0],
        startDate: dayjs(startDate).format('YYYY-MM-DD'),
        endDate: dayjs(endDate).format('YYYY-MM-DD'),
        storeId,
        createdBy: currentUser.id,
      }

      if (isApiMode()) {
        for (const empId of values.empIds) {
          const created = await apiCreateSchedule({ ...payload, empId })
          addScheduleFromApi(created)
        }
      } else {
        for (const empId of values.empIds) {
          addSchedule({ ...payload, empId })
        }
      }

      Toast.show({ content: `已为 ${values.empIds.length} 名员工完成排班`, icon: 'success' })
      setShowAddForm(false)
      form.resetFields()
      setStartDate(null)
      setEndDate(null)
    } catch (e) {
      if (e instanceof Error) {
        Toast.show({ content: e.message, icon: 'fail' })
      }
    }
  }

  const handleDelete = (schedule: Schedule) => {
    Dialog.confirm({
      title: '确认删除排班',
      content: `确认删除 ${getEmpName(schedule.empId)} 的排班记录？`,
      onConfirm: async () => {
        try {
          if (isApiMode()) {
            await apiDeleteSchedule(schedule.id)
          }
          deleteSchedule(schedule.id)
          Toast.show({ content: '排班已删除', icon: 'success' })
        } catch (e) {
          if (e instanceof Error) {
            Toast.show({ content: e.message, icon: 'fail' })
          }
        }
      },
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: 80 }}>
      <NavBar
        onBack={() => navigate(-1)}
        style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StoreSwitcher value={storeId} onChange={setSupervisorViewStoreId} />
            <Button color="primary" size="small" onClick={() => setShowAddForm(true)}>
              新增排班
            </Button>
          </div>
        }
      >
        人员排班
      </NavBar>

      <div style={{ padding: '12px 12px 0' }}>
        <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>
          {store?.storeName} · 共 {filteredSchedules.length} 条排班
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            placeholder="搜索员工姓名/工号"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e8e8e8', fontSize: 14, outline: 'none' }}
          />
          <button onClick={handleQuery} style={{ padding: '8px 16px', borderRadius: 8, background: '#1677ff', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>查询</button>
          <button onClick={handleReset} style={{ padding: '8px 16px', borderRadius: 8, background: '#f5f5f5', color: '#666', border: '1px solid #e8e8e8', fontSize: 14, cursor: 'pointer' }}>重置</button>
        </div>
      </div>

      {filteredSchedules.length === 0 ? (
        <Empty description={appliedSearch ? '未找到符合条件的排班' : '暂无排班记录'} style={{ marginTop: 60 }} />
      ) : (
        <div style={{ padding: '0 12px' }}>
          {filteredSchedules.map((schedule) => {
            const emp = employees.find((e) => e.id === schedule.empId)
            const isTransferred = transferredInEmps.some((e) => e?.id === schedule.empId)
            return (
              <SwipeAction
                key={schedule.id}
                rightActions={[
                  {
                    key: 'delete',
                    text: '删除',
                    color: 'danger',
                    onClick: () => handleDelete(schedule),
                  },
                ]}
              >
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    padding: '14px 16px',
                    marginBottom: 10,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    borderLeft: isTransferred ? '4px solid #fa8c16' : '4px solid #1677ff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{emp?.name || '未知'}</span>
                      {isTransferred && (
                        <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>
                          借调
                        </Tag>
                      )}
                    </div>
                    <span style={{ color: '#999', fontSize: 12 }}>{emp?.role}</span>
                  </div>
                  <div style={{ color: '#1677ff', fontSize: 13, marginTop: 6 }}>
                    {getShiftInfo(schedule.shiftId)}
                  </div>
                  <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                    📅 {schedule.startDate} — {schedule.endDate}
                  </div>
                </div>
              </SwipeAction>
            )
          })}
        </div>
      )}

      <Dialog
        visible={showAddForm}
        title="新增排班"
        closeOnMaskClick
        onClose={() => {
          setShowAddForm(false)
          form.resetFields()
          setStartDate(null)
          setEndDate(null)
        }}
        content={
          <Form form={form} layout="vertical">
            <Form.Item
              name="empIds"
              label="选择人员（可多选）"
              rules={[{ required: true, message: '请选择人员' }]}
            >
              <Selector
                multiple
                options={availableEmployees.map((e) => ({
                  label: e
                    ? `${e.name} (${e.role})${transferredInEmps.some((t) => t?.id === e.id) ? ' [借调]' : ''}`
                    : '',
                  value: e?.id || '',
                }))}
              />
            </Form.Item>

            <Form.Item
              name="shiftId"
              label="选择班次"
              rules={[{ required: true, message: '请选择班次' }]}
            >
              <Selector
                options={storeShifts.map((s) => ({
                  label: `${s.shiftName}`,
                  value: s.id,
                }))}
              />
            </Form.Item>

            <Form.Item label="开始日期" required>
              <Button
                fill="outline"
                block
                onClick={() => setShowStartDate(true)}
                style={{ textAlign: 'left' }}
              >
                {startDate ? dayjs(startDate).format('YYYY-MM-DD') : '请选择开始日期'}
              </Button>
            </Form.Item>
            <Form.Item label="结束日期" required>
              <Button
                fill="outline"
                block
                onClick={() => setShowEndDate(true)}
                style={{ textAlign: 'left' }}
              >
                {endDate ? dayjs(endDate).format('YYYY-MM-DD') : '请选择结束日期'}
              </Button>
            </Form.Item>
          </Form>
        }
        actions={[
          {
            key: 'cancel',
            text: '取消',
            onClick: () => {
              setShowAddForm(false)
              form.resetFields()
            },
          },
          { key: 'confirm', text: '确认排班', bold: true, onClick: handleSubmit },
        ]}
      />

      <DatePicker
        visible={showStartDate}
        onClose={() => setShowStartDate(false)}
        onConfirm={(val) => {
          setStartDate(val)
          setShowStartDate(false)
        }}
        title="选择开始日期"
        min={new Date('2024-01-01')}
        max={new Date('2027-12-31')}
      />
      <DatePicker
        visible={showEndDate}
        onClose={() => setShowEndDate(false)}
        onConfirm={(val) => {
          setEndDate(val)
          setShowEndDate(false)
        }}
        title="选择结束日期"
        min={startDate || new Date('2024-01-01')}
        max={new Date('2027-12-31')}
      />
    </div>
  )
}
