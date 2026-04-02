import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Toast, Modal, TextArea } from 'antd-mobile'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { useAppStore } from '../../store'
import { HandoverReceiver } from '../../types'
import { isApiMode, apiCreateHandover, apiConfirmHandover, apiRejectHandover } from '../../api/client'
import dayjs from 'dayjs'

type ViewMode = 'list' | 'form' | 'detail'

const STATUS_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  待审核: { bg: '#fffbe6', color: '#d46b08', label: '待审核' },
  已确认: { bg: '#f6ffed', color: '#389e0d', label: '已确认' },
  已驳回: { bg: '#fff1f0', color: '#cf1322', label: '已驳回' },
}

const PHOTO_FIELDS: { key: string; label: string }[] = [
  { key: 'photoEntrance', label: '门前卫生' },
  { key: 'photoCooked', label: '熟食区' },
  { key: 'photoWindCabinet', label: '风幕柜' },
  { key: 'photoWaterCabinet', label: '水柜' },
  { key: 'photoShelf', label: '货架区' },
  { key: 'photoWarehouse', label: '仓库' },
  { key: 'photoHandover', label: '交接拍照（现金与交接单）' },
]

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 10, paddingLeft: 8, borderLeft: '3px solid #e6232a' }}>
      {children}
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
      <div style={{ fontSize: 13, color: '#666', width: 90, flexShrink: 0, paddingTop: 2 }}>{label}</div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

function ToggleGroup({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {(['是', '否'] as const).map((opt) => {
        const isYes = opt === '是'
        const active = value === isYes
        return (
          <button
            key={opt}
            onClick={() => onChange(isYes)}
            style={{
              padding: '5px 18px',
              borderRadius: 20,
              border: `1.5px solid ${active ? '#e6232a' : '#e0e0e0'}`,
              background: active ? '#fff1f0' : '#fafafa',
              color: active ? '#e6232a' : '#666',
              fontSize: 13,
              fontWeight: active ? 700 : 400,
              cursor: 'pointer',
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

export default function MobileHandover() {
  const navigate = useNavigate()
  const { currentUser, employees, transfers, schedules, shifts, stores, handovers, addHandover, addHandoverFromApi, confirmHandover, rejectHandover } = useAppStore()
  const [view, setView] = useState<ViewMode>('list')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null)

  // ─── 查询筛选状态 ──────────────────────────────────────────────────────────
  const [filterStatus, setFilterStatus] = useState<string>('全部')
  const [filterDateRange, setFilterDateRange] = useState<'本月' | '上月' | '近三月' | '全部'>('全部')
  const [filterHandover, setFilterHandover] = useState('')
  const [appliedStatus, setAppliedStatus] = useState<string>('全部')
  const [appliedDateRange, setAppliedDateRange] = useState<'本月' | '上月' | '近三月' | '全部'>('全部')
  const [appliedHandover, setAppliedHandover] = useState('')

  const handleQuery = () => {
    setAppliedStatus(filterStatus)
    setAppliedDateRange(filterDateRange)
    setAppliedHandover(filterHandover)
  }
  const handleReset = () => {
    setFilterStatus('全部')
    setFilterDateRange('全部')
    setFilterHandover('')
    setAppliedStatus('全部')
    setAppliedDateRange('全部')
    setAppliedHandover('')
  }

  const today = dayjs().format('YYYY-MM-DD')

  if (!currentUser) {
    navigate('/mobile/login')
    return null
  }

  const isManager = currentUser.role === '店长' || currentUser.role === '督导' || currentUser.role === '稽核专员'
  const storeId = currentUser.storeId

  const allStoreHandovers = handovers
    .filter((h) => h.storeId === storeId)
    .sort((a, b) => {
      // 待审核置顶，同状态内按时间倒序
      const statusOrder = (s: string) => (s === '待审核' ? 0 : 1)
      const so = statusOrder(a.status) - statusOrder(b.status)
      if (so !== 0) return so
      return b.createdAt.localeCompare(a.createdAt)
    })

  const pendingReview = isManager ? allStoreHandovers.filter((h) => h.status === '待审核') : []

  // ─── 应用筛选 ──────────────────────────────────────────────────────────────
  const filteredHandovers = allStoreHandovers.filter((h) => {
    if (appliedStatus !== '全部' && h.status !== appliedStatus) return false
    if (appliedHandover.trim() && !h.handoverEmpName.includes(appliedHandover.trim()) && !h.receivers.some((r) => r.empName.includes(appliedHandover.trim()))) return false
    if (appliedDateRange !== '全部') {
      const d = h.createdAt.slice(0, 10)
      if (appliedDateRange === '本月') {
        const start = dayjs().startOf('month').format('YYYY-MM-DD')
        if (d < start) return false
      } else if (appliedDateRange === '上月') {
        const start = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD')
        const end = dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD')
        if (d < start || d > end) return false
      } else if (appliedDateRange === '近三月') {
        const start = dayjs().subtract(3, 'month').format('YYYY-MM-DD')
        if (d < start) return false
      }
    }
    return true
  })

  const getShiftForEmp = (empId: string) => {
    const sc = schedules.find((s) => s.empId === empId && s.startDate <= today && s.endDate >= today)
    if (!sc) return null
    return shifts.find((s) => s.id === sc.shiftId) || null
  }

  const myCurrentShift = getShiftForEmp(currentUser.id)

  const storeEmps = employees.filter((e) => e.storeId === storeId && e.isActive && e.id !== currentUser.id)
  const transferInEmps = transfers
    .filter((t) => t.toStoreId === storeId && t.status === '已批准' && t.startDate <= today && t.endDate >= today)
    .map((t) => employees.find((e) => e.id === t.empId))
    .filter(Boolean) as typeof employees

  const availableReceivers = [...storeEmps, ...transferInEmps.filter((e) => !storeEmps.find((s) => s.id === e.id))]

  // ─── Form state ────────────────────────────────────────────────────────────
  const [selectedReceivers, setSelectedReceivers] = useState<string[]>([])
  const [cashDiff, setCashDiff] = useState(false)
  const [cashAmount, setCashAmount] = useState('')
  const [cashReason, setCashReason] = useState('')
  const [hasInventory, setHasInventory] = useState(false)
  const [inventoryDiff, setInventoryDiff] = useState(false)
  const [inventoryNote, setInventoryNote] = useState('')
  const [hasRestocked, setHasRestocked] = useState(false)
  const [photos, setPhotos] = useState<Record<string, string>>({})

  const handlePhotoClick = async (key: string) => {
    try {
      const photo = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        promptLabelHeader: '拍摄现场照片',
        promptLabelCancel: '取消',
        promptLabelPhoto: '从相册选取',
        promptLabelPicture: '立即拍照',
      })
      if (photo.base64String) {
        setPhotos((prev) => ({ ...prev, [key]: `data:image/jpeg;base64,${photo.base64String}` }))
      }
    } catch (err: any) {
      if (err?.message !== 'User cancelled photos app') {
        Toast.show({ content: '无法启动摄像头，请检查相机权限', icon: 'fail' })
      }
    }
  }

  const toggleReceiver = (empId: string) => {
    setSelectedReceivers((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId],
    )
  }

  const resetForm = () => {
    setSelectedReceivers([])
    setCashDiff(false)
    setCashAmount('')
    setCashReason('')
    setHasInventory(false)
    setInventoryDiff(false)
    setInventoryNote('')
    setHasRestocked(false)
    setPhotos({})
  }

  const handleSubmit = async () => {
    if (selectedReceivers.length === 0) {
      Toast.show({ content: '请选择至少一位接班人', icon: 'fail' })
      return
    }
    const receiverList: HandoverReceiver[] = selectedReceivers.map((id) => {
      const emp = availableReceivers.find((e) => e.id === id)!
      const sh = getShiftForEmp(id)
      return { empId: id, empName: emp.name, role: emp.role, shiftName: sh ? sh.shiftName : '无排班' }
    })
    const store = stores.find((s) => s.id === storeId)
    const payload = {
      storeId,
      companyId: store?.companyId || '',
      handoverEmpId: currentUser.id,
      handoverEmpName: currentUser.name,
      handoverRole: currentUser.role,
      handoverShiftId: myCurrentShift?.id || '',
      handoverShiftName: myCurrentShift?.shiftName || '无排班',
      receivers: receiverList,
      cashDifference: cashDiff,
      cashDiffAmount: cashDiff ? Number(cashAmount) || 0 : undefined,
      cashDiffReason: cashDiff ? cashReason : undefined,
      hasInventory,
      inventoryDiff: hasInventory ? inventoryDiff : false,
      inventoryDiffNote: hasInventory && inventoryDiff ? inventoryNote : undefined,
      hasRestocked,
      ...photos,
      status: '待审核' as const,
    }
    try {
      if (isApiMode()) {
        const created = await apiCreateHandover(payload)
        addHandoverFromApi(created)
      } else {
        addHandover(payload)
      }
      Toast.show({ content: '交接班记录已提交，等待店长审核', icon: 'success' })
      resetForm()
      setView('list')
    } catch (e) {
      Toast.show({ content: e instanceof Error ? e.message : '提交失败', icon: 'fail' })
    }
  }

  const handleConfirm = async (id: string) => {
    try {
      if (isApiMode()) {
        const updated = await apiConfirmHandover(id, currentUser.id)
        addHandoverFromApi(updated)
      } else {
        confirmHandover(id, currentUser.id)
      }
      Toast.show({ content: '已确认交接班', icon: 'success' })
    } catch (e) {
      Toast.show({ content: e instanceof Error ? e.message : '确认失败', icon: 'fail' })
    }
  }

  const handleReject = async () => {
    if (!rejectTargetId) return
    try {
      if (isApiMode()) {
        const updated = await apiRejectHandover(rejectTargetId, currentUser.id, rejectNote)
        addHandoverFromApi(updated)
      } else {
        rejectHandover(rejectTargetId, currentUser.id, rejectNote)
      }
      setShowRejectModal(false)
      setRejectNote('')
      setRejectTargetId(null)
      Toast.show({ content: '已驳回', icon: 'success' })
    } catch (e) {
      Toast.show({ content: e instanceof Error ? e.message : '驳回失败', icon: 'fail' })
    }
  }

  const detailRecord = detailId ? handovers.find((h) => h.id === detailId) : null

  // ─── List View ─────────────────────────────────────────────────────────────
  if (view === 'list') {
    const hasFilter = appliedStatus !== '全部' || appliedDateRange !== '全部' || appliedHandover.trim() !== ''
    return (
      <div style={{ minHeight: '100vh', background: '#f5f6fa', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'linear-gradient(145deg,#ff3b30 0%,#e6232a 55%,#a61010 100%)', padding: '14px 16px 28px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -36, right: -24, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,.08)' }} />
          <div style={{ fontSize: 18, fontWeight: 800 }}>交接班</div>
          <div style={{ fontSize: 12, opacity: .75, marginTop: 3 }}>班次交接记录与审核</div>
        </div>

        <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', marginTop: -14, flex: 1, padding: '16px 14px 90px' }}>
          {isManager && pendingReview.length > 0 && (
            <div style={{ background: '#fffbe6', border: '1px solid #ffd666', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#d46b08', fontWeight: 600 }}>
              ⚠ 有 {pendingReview.length} 条记录待审核
            </div>
          )}

          <button
            onClick={() => { resetForm(); setView('form') }}
            style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg,#ff6060,#e6232a)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(230,35,42,.3)', marginBottom: 14 }}
          >
            + 新增交接班
          </button>

          {/* ── 查询筛选区 ── */}
          <div style={{ background: '#f9f9f9', borderRadius: 12, padding: '12px 12px 10px', marginBottom: 14 }}>
            {/* 搜索框 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid #e8e8e8', borderRadius: 10, padding: '7px 12px', marginBottom: 10 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>
              <input
                type="text"
                value={filterHandover}
                onChange={(e) => setFilterHandover(e.target.value)}
                placeholder="搜索交班人 / 接班人"
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#333', background: 'transparent' }}
              />
              {filterHandover && (
                <button onClick={() => setFilterHandover('')} style={{ border: 'none', background: 'none', color: '#ccc', cursor: 'pointer', padding: 0, fontSize: 16, lineHeight: 1 }}>×</button>
              )}
            </div>

            {/* 日期快选 */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#aaa', alignSelf: 'center', marginRight: 2 }}>时间</span>
              {(['全部', '本月', '上月', '近三月'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFilterDateRange(opt)}
                  style={{ padding: '4px 12px', borderRadius: 20, border: `1.5px solid ${filterDateRange === opt ? '#e6232a' : '#e0e0e0'}`, background: filterDateRange === opt ? '#fff1f0' : '#fff', color: filterDateRange === opt ? '#e6232a' : '#666', fontSize: 12, fontWeight: filterDateRange === opt ? 700 : 400, cursor: 'pointer' }}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* 状态筛选 */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#aaa', alignSelf: 'center', marginRight: 2 }}>状态</span>
              {(['全部', '待审核', '已确认', '已驳回']).map((opt) => {
                const active = filterStatus === opt
                const dotColor = opt === '待审核' ? '#faad14' : opt === '已确认' ? '#52c41a' : opt === '已驳回' ? '#ff4d4f' : '#ccc'
                return (
                  <button
                    key={opt}
                    onClick={() => setFilterStatus(opt)}
                    style={{ padding: '4px 12px', borderRadius: 20, border: `1.5px solid ${active ? '#e6232a' : '#e0e0e0'}`, background: active ? '#fff1f0' : '#fff', color: active ? '#e6232a' : '#666', fontSize: 12, fontWeight: active ? 700 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    {opt !== '全部' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, display: 'inline-block' }} />}
                    {opt}
                  </button>
                )
              })}
            </div>

            <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={handleQuery}
                style={{ padding: '6px 14px', borderRadius: 8, background: '#e6232a', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                查询
              </button>
              <button
                onClick={handleReset}
                style={{ border: 'none', background: 'none', color: '#aaa', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
              >
                重置
              </button>
            </div>
          </div>

          {/* 结果数量 */}
          <div style={{ fontSize: 12, color: '#aaa', marginBottom: 10 }}>
            共 {filteredHandovers.length} 条记录{hasFilter ? `（已筛选，共 ${allStoreHandovers.length} 条）` : ''}
          </div>

          {filteredHandovers.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#bbb', paddingTop: 40, fontSize: 14 }}>
              {hasFilter ? '未找到符合条件的记录' : '暂无交接班记录'}
            </div>
          ) : (
            filteredHandovers.map((h) => {
              const st = STATUS_COLOR[h.status]
              return (
                <div
                  key={h.id}
                  onClick={() => { setDetailId(h.id); setView('detail') }}
                  style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 10, boxShadow: '0 2px 10px rgba(0,0,0,.07)', cursor: 'pointer', borderLeft: `4px solid ${h.status === '已确认' ? '#52c41a' : h.status === '已驳回' ? '#ff4d4f' : '#faad14'}` }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>
                        {h.handoverEmpName} → {h.receivers.map((r) => r.empName).join('、')}
                      </div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{h.handoverShiftName}</div>
                      <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{h.createdAt.slice(0, 16)}</div>
                    </div>
                    <span style={{ background: st.bg, color: st.color, borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {st.label}
                    </span>
                  </div>
                  {h.cashDifference && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#cf1322', background: '#fff1f0', padding: '4px 10px', borderRadius: 6, display: 'inline-block' }}>
                      现金差异 ¥{h.cashDiffAmount}
                    </div>
                  )}
                  {isManager && h.status === '待审核' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleConfirm(h.id)}
                        style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'linear-gradient(135deg,#52c41a,#389e0d)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        确认
                      </button>
                      <button
                        onClick={() => { setRejectTargetId(h.id); setShowRejectModal(true) }}
                        style={{ flex: 1, padding: '8px', borderRadius: 8, background: '#fff5f5', color: '#ff4d4f', border: '1.5px solid #ffa39e', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        驳回
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        <Modal
          visible={showRejectModal}
          title="驳回原因"
          content={
            <TextArea
              value={rejectNote}
              onChange={setRejectNote}
              placeholder="请填写驳回原因"
              rows={3}
            />
          }
          closeOnAction
          onClose={() => setShowRejectModal(false)}
          actions={[
            { key: 'cancel', text: '取消', onClick: () => setShowRejectModal(false) },
            { key: 'confirm', text: '确认驳回', danger: true, onClick: handleReject },
          ]}
        />
      </div>
    )
  }

  // ─── Detail View ────────────────────────────────────────────────────────────
  if (view === 'detail' && detailRecord) {
    const st = STATUS_COLOR[detailRecord.status]
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
    return (
      <div style={{ minHeight: '100vh', background: '#f5f6fa' }}>
        <div style={{ background: 'linear-gradient(145deg,#ff3b30 0%,#e6232a 55%,#a61010 100%)', padding: '14px 16px 28px', color: '#fff', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setView('list')} style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 14 }}>‹ 返回</button>
            <span style={{ fontWeight: 800, fontSize: 16 }}>交接班详情</span>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', marginTop: -14, padding: '16px 14px 90px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, color: '#aaa' }}>{detailRecord.createdAt.slice(0, 16)}</span>
            <span style={{ background: st.bg, color: st.color, borderRadius: 8, padding: '3px 12px', fontSize: 13, fontWeight: 700 }}>{st.label}</span>
          </div>

          <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <SectionTitle>人员信息</SectionTitle>
            <FieldRow label="交班人">
              <span style={{ fontWeight: 600 }}>{detailRecord.handoverEmpName}</span>
              <span style={{ fontSize: 11, color: '#888', marginLeft: 6 }}>{detailRecord.handoverRole} · {detailRecord.handoverShiftName}</span>
            </FieldRow>
            <FieldRow label="接班人">
              <div>
                {detailRecord.receivers.map((r) => (
                  <div key={r.empId} style={{ marginBottom: 2 }}>
                    <span style={{ fontWeight: 600 }}>{r.empName}</span>
                    <span style={{ fontSize: 11, color: '#888', marginLeft: 6 }}>{r.role} · {r.shiftName}</span>
                  </div>
                ))}
              </div>
            </FieldRow>
          </div>

          <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <SectionTitle>现金与库存</SectionTitle>
            <FieldRow label="现金差异">
              <span style={{ color: detailRecord.cashDifference ? '#cf1322' : '#52c41a', fontWeight: 600 }}>
                {detailRecord.cashDifference ? `是 · ¥${detailRecord.cashDiffAmount}` : '否'}
              </span>
            </FieldRow>
            {detailRecord.cashDifference && detailRecord.cashDiffReason && (
              <FieldRow label="差异原因"><span style={{ color: '#555', fontSize: 13 }}>{detailRecord.cashDiffReason}</span></FieldRow>
            )}
            <FieldRow label="是否盘点">
              <span style={{ fontWeight: 600, color: detailRecord.hasInventory ? '#1677ff' : '#aaa' }}>
                {detailRecord.hasInventory ? '是' : '否'}
              </span>
            </FieldRow>
            {detailRecord.hasInventory && (
              <FieldRow label="盘点差异">
                <span style={{ fontWeight: 600, color: detailRecord.inventoryDiff ? '#cf1322' : '#52c41a' }}>
                  {detailRecord.inventoryDiff ? '有差异' : '无差异'}
                </span>
              </FieldRow>
            )}
            {detailRecord.inventoryDiff && detailRecord.inventoryDiffNote && (
              <FieldRow label="差异备注"><span style={{ fontSize: 13, color: '#555' }}>{detailRecord.inventoryDiffNote}</span></FieldRow>
            )}
            <FieldRow label="已补货">
              <span style={{ fontWeight: 600, color: detailRecord.hasRestocked ? '#52c41a' : '#faad14' }}>
                {detailRecord.hasRestocked ? '是' : '否'}
              </span>
            </FieldRow>
          </div>

          <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <SectionTitle>现场照片</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {PHOTO_FIELDS.map(({ key, label }) => {
                const src = (detailRecord as unknown as Record<string, unknown>)[key] as string | undefined
                return (
                  <div key={key} style={{ textAlign: 'center' }}>
                    <div
                      onClick={() => src && setLightboxSrc(src)}
                      style={{ height: 72, borderRadius: 10, background: src ? 'transparent' : '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: src ? 'pointer' : 'default', border: '1px solid #eee' }}
                    >
                      {src ? (
                        <img src={src} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 11, color: '#ccc' }}>未拍照</span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: '#888', marginTop: 3 }}>{label}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {detailRecord.reviewNote && (
            <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 12, padding: 12, marginBottom: 14, fontSize: 13, color: '#cf1322' }}>
              <strong>驳回原因：</strong>{detailRecord.reviewNote}
            </div>
          )}

          {isManager && detailRecord.status === '待审核' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { handleConfirm(detailRecord.id); setView('list') }}
                style={{ flex: 1, padding: '13px', borderRadius: 12, background: 'linear-gradient(135deg,#52c41a,#389e0d)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                确认交接班
              </button>
              <button
                onClick={() => { setRejectTargetId(detailRecord.id); setShowRejectModal(true) }}
                style={{ flex: 1, padding: '13px', borderRadius: 12, background: '#fff5f5', color: '#ff4d4f', border: '1.5px solid #ffa39e', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                驳回
              </button>
            </div>
          )}
        </div>

        {lightboxSrc && (
          <div
            onClick={() => setLightboxSrc(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <img src={lightboxSrc} alt="preview" style={{ maxWidth: '95vw', maxHeight: '90vh', borderRadius: 8 }} />
          </div>
        )}

        <Modal
          visible={showRejectModal}
          title="驳回原因"
          content={<TextArea value={rejectNote} onChange={setRejectNote} placeholder="请填写驳回原因" rows={3} />}
          closeOnAction
          onClose={() => setShowRejectModal(false)}
          actions={[
            { key: 'cancel', text: '取消', onClick: () => setShowRejectModal(false) },
            { key: 'confirm', text: '确认驳回', danger: true, onClick: () => { handleReject(); setView('list') } },
          ]}
        />
      </div>
    )
  }

  // ─── Form View ──────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      <div style={{ background: 'linear-gradient(145deg,#ff3b30 0%,#e6232a 55%,#a61010 100%)', padding: '14px 16px 28px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setView('list')} style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 14 }}>‹ 返回</button>
          <span style={{ fontWeight: 800, fontSize: 16 }}>新增交接班</span>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', marginTop: -14, padding: '16px 14px 100px' }}>

        {/* 交班人 */}
        <div style={{ marginBottom: 20 }}>
          <SectionTitle>交班人信息</SectionTitle>
          <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#ffb0b0,#f29194)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#c01010' }}>
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{currentUser.name}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  {currentUser.role} · {myCurrentShift ? myCurrentShift.shiftName : '当前无排班'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 接班人 */}
        <div style={{ marginBottom: 20 }}>
          <SectionTitle>接班人（可多选）</SectionTitle>
          {availableReceivers.length === 0 ? (
            <div style={{ color: '#bbb', fontSize: 13, padding: '8px 0' }}>暂无可选人员</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {availableReceivers.map((emp) => {
                const sh = getShiftForEmp(emp.id)
                const selected = selectedReceivers.includes(emp.id)
                return (
                  <div
                    key={emp.id}
                    onClick={() => toggleReceiver(emp.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: selected ? '#fff1f0' : '#f9f9f9', border: `1.5px solid ${selected ? '#e6232a' : 'transparent'}`, cursor: 'pointer' }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: selected ? 'linear-gradient(135deg,#ffb0b0,#f29194)' : '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: selected ? '#c01010' : '#999', flexShrink: 0 }}>
                      {emp.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{emp.name}</div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{emp.role} · {sh ? sh.shiftName : '无排班'}</div>
                    </div>
                    {selected && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e6232a" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 现金 */}
        <div style={{ marginBottom: 20 }}>
          <SectionTitle>现金情况</SectionTitle>
          <FieldRow label="是否有差异">
            <ToggleGroup value={cashDiff} onChange={setCashDiff} />
          </FieldRow>
          {cashDiff && (
            <>
              <FieldRow label="差异金额">
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#666' }}>¥</span>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="请输入金额"
                    style={{ flex: 1, border: '1.5px solid #e0e0e0', borderRadius: 8, padding: '7px 10px', fontSize: 14, outline: 'none' }}
                  />
                </div>
              </FieldRow>
              <FieldRow label="差异原因">
                <textarea
                  value={cashReason}
                  onChange={(e) => setCashReason(e.target.value)}
                  placeholder="请说明原因"
                  rows={2}
                  style={{ width: '100%', border: '1.5px solid #e0e0e0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                />
              </FieldRow>
            </>
          )}
        </div>

        {/* 盘点 */}
        <div style={{ marginBottom: 20 }}>
          <SectionTitle>库存盘点</SectionTitle>
          <FieldRow label="是否已盘点">
            <ToggleGroup value={hasInventory} onChange={setHasInventory} />
          </FieldRow>
          {hasInventory && (
            <>
              <FieldRow label="盘点有差异">
                <ToggleGroup value={inventoryDiff} onChange={setInventoryDiff} />
              </FieldRow>
              {inventoryDiff && (
                <FieldRow label="差异备注">
                  <textarea
                    value={inventoryNote}
                    onChange={(e) => setInventoryNote(e.target.value)}
                    placeholder="请说明差异情况"
                    rows={2}
                    style={{ width: '100%', border: '1.5px solid #e0e0e0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                  />
                </FieldRow>
              )}
            </>
          )}
          <FieldRow label="是否已补货">
            <ToggleGroup value={hasRestocked} onChange={setHasRestocked} />
          </FieldRow>
        </div>

        {/* 照片 */}
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>现场照片</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {PHOTO_FIELDS.map(({ key, label }) => {
              const src = photos[key]
              return (
                <div key={key} onClick={() => handlePhotoClick(key)} style={{ cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ height: 80, borderRadius: 12, background: src ? 'transparent' : '#f9f9f9', border: `1.5px dashed ${src ? '#e6232a' : '#ddd'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                    {src ? (
                      <img src={src} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    )}
                    {src && (
                      <div style={{ position: 'absolute', top: 4, right: 4, background: '#e6232a', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>{label}</div>
                </div>
              )
            })}
          </div>
          {/* 拍照由 Capacitor Camera 原生插件处理，无需隐藏 input */}
        </div>

        <button
          onClick={handleSubmit}
          style={{ width: '100%', padding: '15px', borderRadius: 14, background: 'linear-gradient(135deg,#ff6060,#e6232a)', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 0 #a61010,0 6px 16px rgba(230,35,42,.3)' }}
        >
          提交交接班
        </button>
      </div>
    </div>
  )
}
