import React, { useState } from 'react'
import {
  NavBar,
  Tabs,
  Button,
  Form,
  Selector,
  DatePicker,
  Toast,
  Dialog,
  List,
  Tag,
  Empty,
  TextArea,
  Badge,
} from 'antd-mobile'
import { AddCircleOutline } from 'antd-mobile-icons'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'
import { Transfer } from '../../types'
import StoreSwitcher from '../../components/mobile/StoreSwitcher'
import { isApiMode, apiCreateTransfer, apiApproveTransfer, apiRejectTransfer } from '../../api/client'
import dayjs from 'dayjs'

type TabKey = 'pending' | 'initiated' | 'history'

export default function MobileTransfer() {
  const navigate = useNavigate()
  const {
    currentUser,
    employees,
    stores,
    transfers,
    addTransfer,
    addTransferFromApi,
    approveTransfer,
    rejectTransfer,
    supervisorViewStoreId,
    setSupervisorViewStoreId,
  } = useAppStore()
  const [activeTab, setActiveTab] = useState<TabKey>('pending')
  const [showAddForm, setShowAddForm] = useState(false)
  const [form] = Form.useForm()
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [showStartDate, setShowStartDate] = useState(false)
  const [showEndDate, setShowEndDate] = useState(false)
  const [selectedFromStore, setSelectedFromStore] = useState<string>('')
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingId, setRejectingId] = useState('')
  const [historySearch, setHistorySearch] = useState('')
  const [appliedHistorySearch, setAppliedHistorySearch] = useState('')

  const handleHistoryQuery = () => setAppliedHistorySearch(historySearch)
  const handleHistoryReset = () => { setHistorySearch(''); setAppliedHistorySearch('') }

  if (!currentUser) {
    navigate('/mobile/login')
    return null
  }

  const isManager = currentUser.role === '店长' || currentUser.role === '督导'
  const viewStoreId =
    currentUser.role === '督导' && supervisorViewStoreId
      ? supervisorViewStoreId
      : currentUser.storeId
  const currentStore = stores.find((s) => s.id === viewStoreId)

  const otherStores = stores.filter(
    (s) => s.id !== viewStoreId && s.companyId === currentStore?.companyId && s.isActive,
  )

  const getEmpsFromStore = (storeId: string) =>
    employees.filter((e) => e.storeId === storeId && e.isActive)

  const pendingTransfers = transfers.filter(
    (t) => t.status === '待审批' && t.fromStoreId === viewStoreId,
  )

  const initiatedTransfers = transfers.filter(
    (t) => t.toStoreId === viewStoreId,
  )

  const getEmpName = (id: string) => employees.find((e) => e.id === id)?.name || '未知'
  const getStoreName = (id: string) => stores.find((s) => s.id === id)?.storeName || '未知'

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (!startDate || !endDate) {
        Toast.show({ content: '请选择借调日期', icon: 'fail' })
        return
      }
      if (dayjs(endDate).isBefore(dayjs(startDate))) {
        Toast.show({ content: '结束日期不能早于开始日期', icon: 'fail' })
        return
      }

      const payload = {
        empId: values.empId[0],
        fromStoreId: selectedFromStore,
        toStoreId: viewStoreId,
        companyId: currentStore?.companyId || '',
        startDate: dayjs(startDate).format('YYYY-MM-DD'),
        endDate: dayjs(endDate).format('YYYY-MM-DD'),
        status: '待审批' as const,
        initiatedBy: currentUser.id,
        reason: values.reason,
      }
      if (isApiMode()) {
        const created = await apiCreateTransfer(payload)
        addTransferFromApi(created)
      } else {
        addTransfer(payload)
      }

      Toast.show({ content: '借调申请已发起，等待对方门店店长审批', icon: 'success' })
      setShowAddForm(false)
      form.resetFields()
      setStartDate(null)
      setEndDate(null)
      setSelectedFromStore('')
    } catch (e) {
      if (e instanceof Error) Toast.show({ content: e.message, icon: 'fail' })
    }
  }

  const handleApprove = (transfer: Transfer) => {
    Dialog.confirm({
      title: '确认批准',
      content: `批准 ${getEmpName(transfer.empId)} 借调至 ${getStoreName(transfer.toStoreId)}？`,
      confirmText: '批准',
      onConfirm: async () => {
        try {
          if (isApiMode()) {
            const updated = await apiApproveTransfer(transfer.id, currentUser.id)
            addTransferFromApi(updated)
          } else {
            approveTransfer(transfer.id, currentUser.id)
          }
          Toast.show({ content: '已批准借调申请', icon: 'success' })
        } catch (e) {
          Toast.show({ content: e instanceof Error ? e.message : '批准失败', icon: 'fail' })
        }
      },
    })
  }

  const handleReject = (transfer: Transfer) => {
    Dialog.confirm({
      title: '拒绝借调',
      content: (
        <div>
          <div style={{ marginBottom: 8 }}>
            确认拒绝 {getEmpName(transfer.empId)} 的借调申请？
          </div>
          <TextArea
            placeholder="请输入拒绝原因（可选）"
            onChange={(v) => setRejectReason(v)}
            rows={3}
          />
        </div>
      ),
      confirmText: '拒绝',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          if (isApiMode()) {
            const updated = await apiRejectTransfer(transfer.id, currentUser.id, rejectReason)
            addTransferFromApi(updated)
          } else {
            rejectTransfer(transfer.id, currentUser.id, rejectReason)
          }
          Toast.show({ content: '已拒绝借调申请', icon: 'success' })
          setRejectReason('')
        } catch (e) {
          Toast.show({ content: e instanceof Error ? e.message : '拒绝失败', icon: 'fail' })
        }
      },
    })
  }

  const getStatusTag = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      待审批: { color: 'warning', text: '待审批' },
      已批准: { color: 'success', text: '已批准' },
      已拒绝: { color: 'danger', text: '已拒绝' },
    }
    const c = config[status] || { color: 'default', text: status }
    return (
      <Tag color={c.color as 'warning' | 'success' | 'danger'} fill="outline">
        {c.text}
      </Tag>
    )
  }

  const TransferCard = ({
    transfer,
    showActions = false,
  }: {
    transfer: Transfer
    showActions?: boolean
  }) => {
    const today = dayjs().format('YYYY-MM-DD')
    const isActive =
      transfer.status === '已批准' &&
      transfer.startDate <= today &&
      transfer.endDate >= today

    return (
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: '14px 16px',
          marginBottom: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          borderLeft: `4px solid ${isActive ? '#52c41a' : transfer.status === '待审批' ? '#faad14' : transfer.status === '已拒绝' ? '#ff4d4f' : '#d9d9d9'}`,
        }}
      >
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <div>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{getEmpName(transfer.empId)}</span>
            {isActive && (
              <Tag color="success" style={{ marginLeft: 8, fontSize: 11 }}>
                借调中
              </Tag>
            )}
          </div>
          {getStatusTag(transfer.status)}
        </div>
        <div style={{ color: '#666', fontSize: 13, marginTop: 8 }}>
          <div>
            📤 {getStoreName(transfer.fromStoreId)} → 📥 {getStoreName(transfer.toStoreId)}
          </div>
          <div style={{ marginTop: 4 }}>
            📅 {transfer.startDate} — {transfer.endDate}
          </div>
          {transfer.reason && (
            <div style={{ marginTop: 4, color: '#999' }}>原因: {transfer.reason}</div>
          )}
          {transfer.rejectReason && (
            <div style={{ marginTop: 4, color: '#ff4d4f' }}>
              拒绝原因: {transfer.rejectReason}
            </div>
          )}
        </div>
        {showActions && transfer.status === '待审批' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button
              color="danger"
              fill="outline"
              size="small"
              style={{ flex: 1 }}
              onClick={() => handleReject(transfer)}
            >
              拒绝
            </Button>
            <Button
              color="success"
              size="small"
              style={{ flex: 1 }}
              onClick={() => handleApprove(transfer)}
            >
              批准
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: 80 }}>
      <div
        style={{
          background: 'linear-gradient(145deg, #ff3b30 0%, #e6232a 55%, #a61010 100%)',
          padding: '16px 16px 8px',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>人员借调</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{currentStore?.storeName}</div>
          </div>
          <StoreSwitcher value={viewStoreId} onChange={setSupervisorViewStoreId} />
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabKey)}
        style={{ background: '#fff', '--active-line-color': '#1677ff' }}
      >
        <Tabs.Tab
          title={
            <span>
              待审批
              {pendingTransfers.length > 0 && (
                <Badge
                  content={pendingTransfers.length}
                  style={{ '--right': '-8px', '--top': '-2px' }}
                />
              )}
            </span>
          }
          key="pending"
        />
        <Tabs.Tab title="我发起的" key="initiated" />
        <Tabs.Tab title="全部记录" key="history" />
      </Tabs>

      <div style={{ padding: '12px 12px' }}>
        {activeTab === 'pending' && (
          <div>
            {pendingTransfers.length === 0 ? (
              <Empty description="暂无待审批的借调申请" style={{ marginTop: 40 }} />
            ) : (
              pendingTransfers.map((t) => (
                <TransferCard key={t.id} transfer={t} showActions={isManager} />
              ))
            )}
          </div>
        )}

        {activeTab === 'initiated' && (
          <div>
            {isManager && (
              <Button
                color="primary"
                block
                style={{ marginBottom: 12, borderRadius: 8 }}
                onClick={() => setShowAddForm(true)}
              >
                <AddCircleOutline style={{ marginRight: 8 }} />
                发起借调申请
              </Button>
            )}
            {initiatedTransfers.length === 0 ? (
              <Empty description="暂无发起的借调记录" style={{ marginTop: 40 }} />
            ) : (
              initiatedTransfers.map((t) => <TransferCard key={t.id} transfer={t} />)
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="搜索员工/门店"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e8e8e8', fontSize: 14, outline: 'none' }}
              />
              <button onClick={handleHistoryQuery} style={{ padding: '8px 16px', borderRadius: 8, background: '#1677ff', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>查询</button>
              <button onClick={handleHistoryReset} style={{ padding: '8px 16px', borderRadius: 8, background: '#f5f5f5', color: '#666', border: '1px solid #e8e8e8', fontSize: 14, cursor: 'pointer' }}>重置</button>
            </div>
            {(() => {
              const historyList = transfers.filter(
                (t) => t.fromStoreId === viewStoreId || t.toStoreId === viewStoreId,
              )
              const filteredHistory = appliedHistorySearch
                ? historyList.filter(
                    (t) =>
                      getEmpName(t.empId).toLowerCase().includes(appliedHistorySearch.toLowerCase()) ||
                      getStoreName(t.fromStoreId).toLowerCase().includes(appliedHistorySearch.toLowerCase()) ||
                      getStoreName(t.toStoreId).toLowerCase().includes(appliedHistorySearch.toLowerCase()),
                  )
                : historyList
              return filteredHistory.length === 0 ? (
              <Empty description={appliedHistorySearch ? '未找到符合条件的记录' : '暂无借调记录'} style={{ marginTop: 40 }} />
            ) : (
              filteredHistory
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map((t) => <TransferCard key={t.id} transfer={t} />)
            )
            })()}
          </div>
        )}
      </div>

      <Dialog
        visible={showAddForm}
        title="发起借调申请"
        closeOnMaskClick
        onClose={() => {
          setShowAddForm(false)
          form.resetFields()
          setStartDate(null)
          setEndDate(null)
          setSelectedFromStore('')
        }}
        content={
          <Form form={form} layout="vertical">
            <Form.Item label="调出门店" required>
              <Selector
                options={otherStores.map((s) => ({ label: s.storeName, value: s.id }))}
                onChange={(vals) => {
                  setSelectedFromStore(vals[0] || '')
                  form.setFieldValue('empId', [])
                }}
              />
            </Form.Item>

            <Form.Item
              name="empId"
              label="借调人员"
              rules={[{ required: true, message: '请选择借调人员' }]}
            >
              <Selector
                options={
                  selectedFromStore
                    ? getEmpsFromStore(selectedFromStore).map((e) => ({
                        label: `${e.name} (${e.role})`,
                        value: e.id,
                      }))
                    : []
                }
              />
            </Form.Item>

            <Form.Item label="借调开始日期" required>
              <Button
                fill="outline"
                block
                onClick={() => setShowStartDate(true)}
                style={{ textAlign: 'left' }}
              >
                {startDate ? dayjs(startDate).format('YYYY-MM-DD') : '请选择开始日期'}
              </Button>
            </Form.Item>
            <Form.Item label="借调结束日期" required>
              <Button
                fill="outline"
                block
                onClick={() => setShowEndDate(true)}
                style={{ textAlign: 'left' }}
              >
                {endDate ? dayjs(endDate).format('YYYY-MM-DD') : '请选择结束日期'}
              </Button>
            </Form.Item>

            <Form.Item name="reason" label="借调原因">
              <TextArea placeholder="请输入借调原因（可选）" rows={2} />
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
          { key: 'confirm', text: '提交申请', bold: true, onClick: handleSubmit },
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
        min={new Date()}
      />
      <DatePicker
        visible={showEndDate}
        onClose={() => setShowEndDate(false)}
        onConfirm={(val) => {
          setEndDate(val)
          setShowEndDate(false)
        }}
        title="选择结束日期"
        min={startDate || new Date()}
      />
    </div>
  )
}
