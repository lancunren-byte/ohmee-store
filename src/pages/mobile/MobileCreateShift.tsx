import React, { useState } from 'react'
import {
  NavBar,
  List,
  Button,
  Form,
  Input,
  Selector,
  Picker,
  DatePicker,
  Toast,
  Dialog,
  SwipeAction,
  Tag,
  Empty,
} from 'antd-mobile'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'
import { usePermission } from '../../hooks/usePermission'
import { Shift } from '../../types'
import { isApiMode, apiCreateShift, apiDeactivateShift } from '../../api/client'

const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  const label = `${String(h).padStart(2, '0')}:${m}`
  return { label, value: label }
})

export default function MobileCreateShift() {
  const navigate = useNavigate()
  const { currentUser, shifts, shiftTypes, addShift, addShiftFromApi, deactivateShift, stores, supervisorViewStoreId } = useAppStore()
  const { can } = usePermission()
  const [showAddForm, setShowAddForm] = useState(false)
  const [form] = Form.useForm()
  const [startTime, setStartTime] = useState<string[]>([])
  const [endTime, setEndTime] = useState<string[]>([])
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  const handleQuery = () => setAppliedSearch(searchText)
  const handleReset = () => { setSearchText(''); setAppliedSearch('') }

  if (!currentUser || !can.button('mobile:createShift')) {
    return (
      <div style={{ padding: 24, textAlign: 'center', marginTop: 80 }}>
        <Empty description="仅店长可操作班次管理" />
        <Button color="primary" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>
          返回
        </Button>
      </div>
    )
  }

  const viewStoreId = currentUser.role === '督导' && supervisorViewStoreId ? supervisorViewStoreId : currentUser.storeId
  const store = stores.find((s) => s.id === viewStoreId)
  const companyShiftTypes = store ? shiftTypes.filter((st) => st.companyId === store.companyId) : shiftTypes
  const storeShifts = shifts.filter(
    (s) => s.storeId === viewStoreId && s.isActive,
  )
  const filteredShifts = appliedSearch
    ? storeShifts.filter(
        (s) =>
          s.shiftName.toLowerCase().includes(appliedSearch.toLowerCase()) ||
          (s.shiftNo || '').toLowerCase().includes(appliedSearch.toLowerCase()),
      )
    : storeShifts

  const activeShiftTypes = companyShiftTypes.filter((st) => st.isActive)

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (!startTime[0]) {
        Toast.show({ content: '请选择班次开始时间', icon: 'fail' })
        return
      }
      if (!endTime[0]) {
        Toast.show({ content: '请选择班次结束时间', icon: 'fail' })
        return
      }

      const shiftNo = `SH${String(shifts.length + 1).padStart(3, '0')}`
      const payload = {
        shiftNo,
        shiftName: values.shiftName,
        startTime: startTime[0],
        endTime: endTime[0],
        typeId: values.typeId[0],
        storeId: viewStoreId,
        createdBy: currentUser.id,
        isActive: true,
      }
      if (isApiMode()) {
        const created = await apiCreateShift(payload)
        addShiftFromApi(created)
      } else {
        addShift(payload)
      }
      Toast.show({ content: '班次创建成功', icon: 'success' })
      setShowAddForm(false)
      form.resetFields()
      setStartTime([])
      setEndTime([])
    } catch (e) {
      if (e instanceof Error) Toast.show({ content: e.message, icon: 'fail' })
    }
  }

  const handleDelete = (shift: Shift) => {
    Dialog.confirm({
      title: '确认删除',
      content: `确认停用班次「${shift.shiftName}」？`,
      onConfirm: async () => {
        try {
          if (isApiMode()) await apiDeactivateShift(shift.id)
          deactivateShift(shift.id)
          Toast.show({ content: '班次已停用', icon: 'success' })
        } catch (e) {
          Toast.show({ content: e instanceof Error ? e.message : '停用失败', icon: 'fail' })
        }
      },
    })
  }

  const getTypeName = (typeId: string) =>
    activeShiftTypes.find((t) => t.id === typeId)?.typeName || '-'

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: 80 }}>
      <NavBar
        onBack={() => navigate(-1)}
        style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}
        right={
          <Button
            color="primary"
            size="small"
            onClick={() => setShowAddForm(true)}
          >
            新增班次
          </Button>
        }
      >
        班次管理
      </NavBar>

      <div style={{ padding: '12px 12px 0' }}>
        <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>
          {store?.storeName} · 共 {filteredShifts.length} 个班次
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            placeholder="搜索班次名称/编号"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e8e8e8', fontSize: 14, outline: 'none' }}
          />
          <button onClick={handleQuery} style={{ padding: '8px 16px', borderRadius: 8, background: '#1677ff', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>查询</button>
          <button onClick={handleReset} style={{ padding: '8px 16px', borderRadius: 8, background: '#f5f5f5', color: '#666', border: '1px solid #e8e8e8', fontSize: 14, cursor: 'pointer' }}>重置</button>
        </div>
      </div>

      {filteredShifts.length === 0 ? (
        <Empty description={appliedSearch ? '未找到符合条件的班次' : '暂无班次，点击右上角新增'} style={{ marginTop: 60 }} />
      ) : (
        <div style={{ padding: '0 12px' }}>
          {filteredShifts.map((shift) => (
            <SwipeAction
              key={shift.id}
              rightActions={[
                {
                  key: 'delete',
                  text: '停用',
                  color: 'danger',
                  onClick: () => handleDelete(shift),
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
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{shift.shiftName}</span>
                  <Tag color="blue">{getTypeName(shift.typeId)}</Tag>
                </div>
                <div style={{ color: '#666', fontSize: 13, marginTop: 6 }}>
                  <span>⏰ {shift.startTime} — {shift.endTime}</span>
                  <span style={{ marginLeft: 16, color: '#999' }}>编号: {shift.shiftNo}</span>
                </div>
              </div>
            </SwipeAction>
          ))}
        </div>
      )}

      <Dialog
        visible={showAddForm}
        title="新增班次"
        closeOnMaskClick
        onClose={() => {
          setShowAddForm(false)
          form.resetFields()
          setStartTime([])
          setEndTime([])
        }}
        content={
          <Form form={form} layout="vertical">
            <Form.Item name="shiftName" label="班次名称" rules={[{ required: true }]}>
              <Input placeholder="如：早班 07:00-15:00" />
            </Form.Item>
            <Form.Item
              name="typeId"
              label="班次类型"
              rules={[{ required: true, message: '请选择班次类型' }]}
            >
              <Selector
                columns={3}
                options={activeShiftTypes.map((t) => ({ label: t.typeName, value: t.id }))}
              />
            </Form.Item>
            <Form.Item label="开始时间" required>
              <Button
                fill="outline"
                block
                onClick={() => setShowStartPicker(true)}
                style={{ textAlign: 'left' }}
              >
                {startTime[0] || '请选择开始时间'}
              </Button>
            </Form.Item>
            <Form.Item label="结束时间" required>
              <Button
                fill="outline"
                block
                onClick={() => setShowEndPicker(true)}
                style={{ textAlign: 'left' }}
              >
                {endTime[0] || '请选择结束时间'}
              </Button>
            </Form.Item>
          </Form>
        }
        actions={[
          { key: 'cancel', text: '取消', onClick: () => setShowAddForm(false) },
          { key: 'confirm', text: '创建', bold: true, onClick: handleSubmit },
        ]}
      />

      <Picker
        columns={[timeOptions]}
        visible={showStartPicker}
        onClose={() => setShowStartPicker(false)}
        onConfirm={(val) => {
          setStartTime(val as string[])
          setShowStartPicker(false)
        }}
        title="选择开始时间"
      />
      <Picker
        columns={[timeOptions]}
        visible={showEndPicker}
        onClose={() => setShowEndPicker(false)}
        onConfirm={(val) => {
          setEndTime(val as string[])
          setShowEndPicker(false)
        }}
        title="选择结束时间"
      />
    </div>
  )
}
