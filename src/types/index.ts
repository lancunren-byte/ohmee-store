export type StoreStatus = '营业中' | '建设中' | '已闭店' | '待搬迁'
export type StoreType = '直营店' | '托管店' | '特许加盟店'
export type EmployeeRole = '督导' | '稽核专员' | '店长' | '全职店员' | '管培生' | '兼职店员'

/** 数据权限范围：国家 | 公司 | 区域 | 门店 | 本人 */
export type DataScope = 'country' | 'company' | 'region' | 'store' | 'self'

/** 可配置角色 - 权限管理模块创建 */
export interface Role {
  id: string
  name: string
  companyId: string
  dataScope: DataScope
  menuKeys: string[]
  buttonCodes: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}
export type Gender = '男' | '女'
export type AttendanceStatus = '正常' | '迟到' | '早退' | '迟到早退' | '缺勤' | '未打卡'
export type TransferStatus = '待审批' | '已批准' | '已拒绝'
export type CheckType = '上班打卡' | '下班打卡'

/** 国家 - 数据区隔顶层 */
export interface Country {
  id: string
  code: string
  name: string
  isActive: boolean
  createdAt: string
}

/** 公司 - 隶属于国家，数据区隔第二层 */
export interface Company {
  id: string
  countryId: string
  companyNo: string
  companyName: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Region {
  id: string
  name: string
  companyId: string
  createdAt: string
}

export interface Store {
  id: string
  storeNo: string
  storeName: string
  address: string
  lat: number
  lng: number
  status: StoreStatus
  type: StoreType
  regionId: string
  companyId: string
  supervisorId: string
  managerId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Employee {
  id: string
  empNo: string
  name: string
  gender: Gender
  age: number
  role: EmployeeRole
  roleId?: string
  joinDate: string
  storeId: string
  regionId: string
  companyId: string
  assignedRegionIds?: string[]
  assignedStoreIds?: string[]
  isActive: boolean
  password: string
  avatar?: string
}

export interface ShiftType {
  id: string
  typeNo: string
  typeName: string
  companyId: string
  updatedBy: string
  updatedAt: string
  isActive: boolean
}

export interface Shift {
  id: string
  shiftNo: string
  shiftName: string
  startTime: string
  endTime: string
  typeId: string
  storeId: string
  createdBy: string
  isActive: boolean
  createdAt: string
}

export interface Schedule {
  id: string
  empId: string
  shiftId: string
  startDate: string
  endDate: string
  storeId: string
  createdBy: string
  createdAt: string
}

export interface AttendanceRecord {
  id: string
  empId: string
  scheduleId: string
  shiftId: string
  date: string
  checkInTime?: string
  checkInPhoto?: string
  checkInLat?: number
  checkInLng?: number
  checkOutTime?: string
  checkOutPhoto?: string
  checkOutLat?: number
  checkOutLng?: number
  status: AttendanceStatus
  storeId: string
  isLate: boolean
  isEarlyLeave: boolean
  note?: string
}

export interface Transfer {
  id: string
  empId: string
  fromStoreId: string
  toStoreId: string
  companyId: string
  startDate: string
  endDate: string
  status: TransferStatus
  initiatedBy: string
  approvedBy?: string
  reason?: string
  rejectReason?: string
  createdAt: string
  updatedAt: string
}

export interface CurrentUser {
  id: string
  empNo: string
  name: string
  role: EmployeeRole
  roleId?: string
  storeId: string
  regionId: string
  companyId: string
  countryId: string
  assignedRegionIds?: string[]
  assignedStoreIds?: string[]
}

export type HandoverStatus = '待审核' | '已确认' | '已驳回'

export interface HandoverReceiver {
  empId: string
  empName: string
  role: string
  shiftName: string
}

export interface HandoverRecord {
  id: string
  storeId: string
  companyId: string
  handoverEmpId: string
  handoverEmpName: string
  handoverRole: string
  handoverShiftId: string
  handoverShiftName: string
  receivers: HandoverReceiver[]

  cashDifference: boolean
  cashDiffAmount?: number
  cashDiffReason?: string

  hasInventory: boolean
  inventoryDiff: boolean
  inventoryDiffNote?: string

  hasRestocked: boolean

  photoEntrance?: string
  photoCooked?: string
  photoWindCabinet?: string
  photoWaterCabinet?: string
  photoShelf?: string
  photoWarehouse?: string
  photoHandover?: string

  status: HandoverStatus
  reviewedBy?: string
  reviewNote?: string
  createdAt: string
  updatedAt: string
}
