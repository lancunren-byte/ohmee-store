/**
 * 生产环境 API 客户端
 * 当 VITE_API_URL 有值时使用后端 API，否则使用本地 Zustand
 */
const API_BASE = import.meta.env.VITE_API_URL || ''

export async function apiLogin(empNo: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ empNo, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '登录失败')
  return data
}

export async function apiFetchData() {
  const res = await fetch(`${API_BASE}/api/data`)
  if (!res.ok) throw new Error('获取数据失败')
  return res.json()
}

export async function apiCheckIn(payload: {
  empId: string
  scheduleId: string
  shiftId: string
  date: string
  checkInTime?: string
  checkOutTime?: string
  checkInPhoto?: string
  checkOutPhoto?: string
  checkInLat?: number
  checkInLng?: number
  checkOutLat?: number
  checkOutLng?: number
  status: string
  storeId: string
  isLate: boolean
  isEarlyLeave: boolean
  note?: string
}) {
  const res = await fetch(`${API_BASE}/api/attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      empId: payload.empId,
      scheduleId: payload.scheduleId,
      shiftId: payload.shiftId,
      date: payload.date,
      checkInTime: payload.checkInTime,
      checkOutTime: payload.checkOutTime,
      checkInPhoto: payload.checkInPhoto,
      checkOutPhoto: payload.checkOutPhoto,
      checkInLat: payload.checkInLat,
      checkInLng: payload.checkInLng,
      checkOutLat: payload.checkOutLat,
      checkOutLng: payload.checkOutLng,
      status: payload.status,
      storeId: payload.storeId,
      isLate: payload.isLate,
      isEarlyLeave: payload.isEarlyLeave,
      note: payload.note,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '打卡失败')
  return data
}

export async function apiCreateSchedule(payload: {
  empId: string
  shiftId: string
  startDate: string
  endDate: string
  storeId: string
  createdBy: string
}) {
  const res = await fetch(`${API_BASE}/api/schedules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '创建排班失败')
  return data
}

export async function apiDeleteSchedule(scheduleId: string) {
  const res = await fetch(`${API_BASE}/api/schedules/${scheduleId}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.detail || '删除排班失败')
  }
}

// ─── Region ─────────────────────────────────────────────────────────────────
export async function apiCreateRegion(payload: { name: string; companyId: string }) {
  const res = await fetch(`${API_BASE}/api/regions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '创建区域失败')
  return data
}

export async function apiUpdateRegion(regionId: string, payload: { name?: string; companyId?: string }) {
  const res = await fetch(`${API_BASE}/api/regions/${regionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '更新区域失败')
  return data
}

export async function apiDeleteRegion(regionId: string) {
  const res = await fetch(`${API_BASE}/api/regions/${regionId}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.detail || '删除区域失败')
  }
}

// ─── Store ───────────────────────────────────────────────────────────────────
export async function apiCreateStore(payload: {
  storeNo: string
  storeName: string
  address?: string
  lat?: number
  lng?: number
  status?: string
  type?: string
  regionId: string
  companyId: string
  supervisorId?: string
  managerId?: string
}) {
  const res = await fetch(`${API_BASE}/api/stores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '创建门店失败')
  return data
}

export async function apiUpdateStore(storeId: string, payload: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/api/stores/${storeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '更新门店失败')
  return data
}

export async function apiDeactivateStore(storeId: string) {
  const res = await fetch(`${API_BASE}/api/stores/${storeId}/deactivate`, { method: 'PATCH' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '作废门店失败')
  return data
}

// ─── Employee ───────────────────────────────────────────────────────────────
export async function apiCreateEmployee(payload: {
  empNo: string
  name: string
  gender?: string
  age?: number
  role?: string
  roleId?: string
  joinDate: string
  storeId: string
  regionId: string
  companyId: string
  assignedRegionIds?: string[]
  assignedStoreIds?: string[]
  password?: string
}) {
  const res = await fetch(`${API_BASE}/api/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '创建员工失败')
  return data
}

export async function apiUpdateEmployee(empId: string, payload: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/api/employees/${empId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '更新员工失败')
  return data
}

export async function apiDeactivateEmployee(empId: string) {
  const res = await fetch(`${API_BASE}/api/employees/${empId}/deactivate`, { method: 'PATCH' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '离职处理失败')
  return data
}

// ─── ShiftType ──────────────────────────────────────────────────────────────
export async function apiCreateShiftType(payload: {
  typeNo?: string
  typeName: string
  companyId: string
  updatedBy?: string
}) {
  const res = await fetch(`${API_BASE}/api/shift-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '创建班次类型失败')
  return data
}

export async function apiUpdateShiftType(typeId: string, payload: { typeNo?: string; typeName?: string; updatedBy?: string }) {
  const res = await fetch(`${API_BASE}/api/shift-types/${typeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '更新班次类型失败')
  return data
}

export async function apiDeactivateShiftType(typeId: string) {
  const res = await fetch(`${API_BASE}/api/shift-types/${typeId}/deactivate`, { method: 'PATCH' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '停用班次类型失败')
  return data
}

// ─── Shift ──────────────────────────────────────────────────────────────────
export async function apiCreateShift(payload: {
  shiftNo?: string
  shiftName: string
  startTime: string
  endTime: string
  typeId: string
  storeId: string
  createdBy: string
}) {
  const res = await fetch(`${API_BASE}/api/shifts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '创建班次失败')
  return data
}

export async function apiUpdateShift(shiftId: string, payload: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/api/shifts/${shiftId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '更新班次失败')
  return data
}

export async function apiDeactivateShift(shiftId: string) {
  const res = await fetch(`${API_BASE}/api/shifts/${shiftId}/deactivate`, { method: 'PATCH' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '停用班次失败')
  return data
}

// ─── Transfer ───────────────────────────────────────────────────────────────
export async function apiCreateTransfer(payload: {
  empId: string
  fromStoreId: string
  toStoreId: string
  companyId: string
  startDate: string
  endDate: string
  status?: string
  initiatedBy: string
  reason?: string
}) {
  const res = await fetch(`${API_BASE}/api/transfers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '创建借调申请失败')
  return data
}

export async function apiApproveTransfer(transferId: string, approverId: string) {
  const res = await fetch(`${API_BASE}/api/transfers/${transferId}/approve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approverId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '批准借调失败')
  return data
}

export async function apiRejectTransfer(transferId: string, approverId: string, reason?: string) {
  const res = await fetch(`${API_BASE}/api/transfers/${transferId}/reject`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approverId, reason }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '拒绝借调失败')
  return data
}

// ─── Handover ───────────────────────────────────────────────────────────────
export async function apiCreateHandover(payload: {
  storeId: string
  companyId: string
  handoverEmpId: string
  handoverEmpName: string
  handoverRole: string
  handoverShiftId?: string
  handoverShiftName?: string
  receivers: { empId: string; empName: string; role: string; shiftName: string }[]
  cashDifference?: boolean
  cashDiffAmount?: number
  cashDiffReason?: string
  hasInventory?: boolean
  inventoryDiff?: boolean
  inventoryDiffNote?: string
  hasRestocked?: boolean
  photoEntrance?: string
  photoCooked?: string
  photoWindCabinet?: string
  photoWaterCabinet?: string
  photoShelf?: string
  photoWarehouse?: string
  photoHandover?: string
}) {
  const res = await fetch(`${API_BASE}/api/handovers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '创建交接班失败')
  return data
}

export async function apiConfirmHandover(handoverId: string, reviewerId: string) {
  const res = await fetch(`${API_BASE}/api/handovers/${handoverId}/confirm`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewerId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '确认交接班失败')
  return data
}

export async function apiRejectHandover(handoverId: string, reviewerId: string, note?: string) {
  const res = await fetch(`${API_BASE}/api/handovers/${handoverId}/reject`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewerId, note }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '驳回交接班失败')
  return data
}

// ─── Country ────────────────────────────────────────────────────────────────
export async function apiCreateCountry(payload: { code: string; name: string }) {
  const res = await fetch(`${API_BASE}/api/countries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '创建国家失败')
  return data
}

export async function apiUpdateCountry(countryId: string, payload: { code?: string; name?: string }) {
  const res = await fetch(`${API_BASE}/api/countries/${countryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '更新国家失败')
  return data
}

export async function apiDeactivateCountry(countryId: string) {
  const res = await fetch(`${API_BASE}/api/countries/${countryId}/deactivate`, { method: 'PATCH' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '停用国家失败')
  return data
}

// ─── Company ──────────────────────────────────────────────────────────────────
export async function apiCreateCompany(payload: { countryId: string; companyNo?: string; companyName: string }) {
  const res = await fetch(`${API_BASE}/api/companies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '创建公司失败')
  return data
}

export async function apiUpdateCompany(companyId: string, payload: { countryId?: string; companyNo?: string; companyName?: string }) {
  const res = await fetch(`${API_BASE}/api/companies/${companyId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '更新公司失败')
  return data
}

export async function apiDeactivateCompany(companyId: string) {
  const res = await fetch(`${API_BASE}/api/companies/${companyId}/deactivate`, { method: 'PATCH' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '停用公司失败')
  return data
}

// ─── Role ───────────────────────────────────────────────────────────────────
export async function apiCreateRole(payload: {
  name: string
  companyId: string
  dataScope: string
  menuKeys?: string[]
  buttonCodes?: string[]
}) {
  const res = await fetch(`${API_BASE}/api/roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '创建角色失败')
  return data
}

export async function apiUpdateRole(roleId: string, payload: { name?: string; dataScope?: string; menuKeys?: string[]; buttonCodes?: string[] }) {
  const res = await fetch(`${API_BASE}/api/roles/${roleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '更新角色失败')
  return data
}

export async function apiDeactivateRole(roleId: string) {
  const res = await fetch(`${API_BASE}/api/roles/${roleId}/deactivate`, { method: 'PATCH' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '停用角色失败')
  return data
}

/** 生产构建或配置了 API 地址时使用后端 API */
export function isApiMode(): boolean {
  return import.meta.env.MODE === 'production' || !!import.meta.env.VITE_API_URL
}
