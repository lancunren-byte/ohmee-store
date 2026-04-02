import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Country,
  Company,
  Region,
  Store,
  Employee,
  ShiftType,
  Shift,
  Schedule,
  AttendanceRecord,
  Transfer,
  CurrentUser,
  HandoverRecord,
  Role,
} from '../types'
import {
  initialCountries,
  initialCompanies,
  initialRegions,
  initialStores,
  initialEmployees,
  initialShiftTypes,
  initialShifts,
  initialSchedules,
  initialHandovers,
  initialRoles,
} from '../utils/mockData'
import { generateId } from '../utils/helpers'
import dayjs from 'dayjs'
import { getDataScope, type PCMenuKey, type ButtonCode } from '../config/permissions'

interface AppState {
  countries: Country[]
  companies: Company[]
  roles: Role[]
  regions: Region[]
  stores: Store[]
  employees: Employee[]
  shiftTypes: ShiftType[]
  shifts: Shift[]
  schedules: Schedule[]
  attendances: AttendanceRecord[]
  transfers: Transfer[]
  currentUser: CurrentUser | null

  // Country actions
  addCountry: (country: Omit<Country, 'id' | 'createdAt'>) => void
  updateCountry: (id: string, country: Partial<Country>) => void
  deactivateCountry: (id: string) => void

  // Company actions
  addCompany: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateCompany: (id: string, company: Partial<Company>) => void
  deactivateCompany: (id: string) => void

  // Role actions
  addRole: (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateRole: (id: string, role: Partial<Role>) => void
  deactivateRole: (id: string) => void

  // Region actions
  addRegion: (region: Omit<Region, 'id' | 'createdAt'>) => void
  updateRegion: (id: string, region: Partial<Region>) => void
  deleteRegion: (id: string) => void

  // Store actions
  addStore: (store: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateStore: (id: string, store: Partial<Store>) => void
  deactivateStore: (id: string) => void

  // Employee actions
  addEmployee: (emp: Omit<Employee, 'id'>) => void
  updateEmployee: (id: string, emp: Partial<Employee>) => void
  deactivateEmployee: (id: string) => void

  // ShiftType actions
  addShiftType: (st: Omit<ShiftType, 'id' | 'updatedAt'>) => void
  updateShiftType: (id: string, st: Partial<ShiftType>) => void
  deactivateShiftType: (id: string) => void

  // Shift actions
  addShift: (shift: Omit<Shift, 'id' | 'createdAt'>) => void
  updateShift: (id: string, shift: Partial<Shift>) => void
  deactivateShift: (id: string) => void

  // Schedule actions
  addSchedule: (schedule: Omit<Schedule, 'id' | 'createdAt'>) => void
  addScheduleFromApi: (schedule: Schedule) => void
  deleteSchedule: (id: string) => void

  // 从 API 写入后合并到本地（用于 isApiMode 时的 create 流程）
  addRegionFromApi: (region: Region) => void
  addStoreFromApi: (store: Store) => void
  addEmployeeFromApi: (emp: Employee) => void
  addShiftTypeFromApi: (st: ShiftType) => void
  addShiftFromApi: (shift: Shift) => void
  addTransferFromApi: (transfer: Transfer) => void
  addHandoverFromApi: (record: HandoverRecord) => void
  addCountryFromApi: (country: Country) => void
  addCompanyFromApi: (company: Company) => void
  addRoleFromApi: (role: Role) => void

  // Attendance actions
  addAttendance: (record: Omit<AttendanceRecord, 'id'>) => void
  addAttendanceFromApi: (record: AttendanceRecord) => void
  updateAttendance: (id: string, record: Partial<AttendanceRecord>) => void

  // Transfer actions
  addTransfer: (transfer: Omit<Transfer, 'id' | 'createdAt' | 'updatedAt'>) => void
  approveTransfer: (id: string, approverId: string) => void
  rejectTransfer: (id: string, approverId: string, reason: string) => void

  // Handover actions
  handovers: HandoverRecord[]
  addHandover: (record: Omit<HandoverRecord, 'id' | 'createdAt' | 'updatedAt'>) => void
  confirmHandover: (id: string, reviewerId: string) => void
  rejectHandover: (id: string, reviewerId: string, note: string) => void

  // Auth
  login: (user: CurrentUser) => void
  logout: () => void

  // 生产环境：从 API 水合数据
  hydrateFromApi: (data: {
    countries?: Country[]
    companies?: Company[]
    regions?: Region[]
    stores?: Store[]
    employees?: (Employee & { password?: string })[]
    shiftTypes?: ShiftType[]
    shifts?: Shift[]
    schedules?: Schedule[]
    attendances?: AttendanceRecord[]
    transfers?: Transfer[]
    handovers?: HandoverRecord[]
    roles?: Role[]
  }) => void

  // 督导门店视图
  supervisorViewStoreId: string | null
  setSupervisorViewStoreId: (storeId: string) => void

  // PC 端公司/国家视图（数据区隔）
  selectedCompanyId: string | null
  selectedCountryId: string | null
  setSelectedCompany: (companyId: string) => void
  setSelectedCountry: (countryId: string) => void

  // Helpers
  getStoreEmployees: (storeId: string) => Employee[]
  getTransferredInEmployees: (storeId: string, date?: string) => Employee[]
  getEffectiveStore: (empId: string, date?: string) => string
  getStoresByCompany: (companyId: string) => Store[]
  getRegionsByCompany: (companyId: string) => Region[]
  getEmployeesByCompany: (companyId: string) => Employee[]

  // 数据权限：按当前用户角色过滤
  getScopedRegions: (companyId: string) => Region[]
  getScopedStores: (companyId: string) => Store[]
  getScopedEmployees: (companyId: string) => Employee[]
  getScopedHandovers: (companyId: string) => HandoverRecord[]
  getScopedShiftTypes: (companyId: string) => ShiftType[]

  getRolesByCompany: (companyId: string) => Role[]
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      countries: initialCountries,
      companies: initialCompanies,
      roles: initialRoles,
      regions: initialRegions,
      stores: initialStores,
      employees: initialEmployees,
      shiftTypes: initialShiftTypes,
      shifts: initialShifts,
      schedules: initialSchedules,
      attendances: [],
      transfers: [],
      handovers: initialHandovers,
      currentUser: null,
      supervisorViewStoreId: null,
      selectedCompanyId: initialCompanies[0]?.id || null,
      selectedCountryId: initialCountries[0]?.id || null,

      addCountry: (country) =>
        set((state) => ({
          countries: [
            ...state.countries,
            { ...country, id: generateId(), createdAt: dayjs().format('YYYY-MM-DD') },
          ],
        })),

      updateCountry: (id, country) =>
        set((state) => ({
          countries: state.countries.map((c) => (c.id === id ? { ...c, ...country } : c)),
        })),

      deactivateCountry: (id) =>
        set((state) => ({
          countries: state.countries.map((c) => (c.id === id ? { ...c, isActive: false } : c)),
        })),

      addCompany: (company) =>
        set((state) => ({
          companies: [
            ...state.companies,
            {
              ...company,
              id: generateId(),
              createdAt: dayjs().format('YYYY-MM-DD'),
              updatedAt: dayjs().format('YYYY-MM-DD'),
            },
          ],
        })),

      updateCompany: (id, company) =>
        set((state) => ({
          companies: state.companies.map((c) =>
            c.id === id ? { ...c, ...company, updatedAt: dayjs().format('YYYY-MM-DD') } : c,
          ),
        })),

      deactivateCompany: (id) =>
        set((state) => ({
          companies: state.companies.map((c) =>
            c.id === id ? { ...c, isActive: false, updatedAt: dayjs().format('YYYY-MM-DD') } : c,
          ),
        })),

      addRole: (role) =>
        set((state) => ({
          roles: [
            ...state.roles,
            {
              ...role,
              id: generateId(),
              createdAt: dayjs().format('YYYY-MM-DD'),
              updatedAt: dayjs().format('YYYY-MM-DD'),
            },
          ],
        })),

      updateRole: (id, role) =>
        set((state) => ({
          roles: state.roles.map((r) =>
            r.id === id ? { ...r, ...role, updatedAt: dayjs().format('YYYY-MM-DD') } : r,
          ),
        })),

      deactivateRole: (id) =>
        set((state) => ({
          roles: state.roles.map((r) => (r.id === id ? { ...r, isActive: false } : r)),
        })),

      addRegion: (region) =>
        set((state) => ({
          regions: [
            ...state.regions,
            { ...region, id: generateId(), createdAt: dayjs().format('YYYY-MM-DD') },
          ],
        })),

      updateRegion: (id, region) =>
        set((state) => ({
          regions: state.regions.map((r) => (r.id === id ? { ...r, ...region } : r)),
        })),

      deleteRegion: (id) =>
        set((state) => ({
          regions: state.regions.filter((r) => r.id !== id),
        })),

      addStore: (store) =>
        set((state) => ({
          stores: [
            ...state.stores,
            {
              ...store,
              id: generateId(),
              createdAt: dayjs().format('YYYY-MM-DD'),
              updatedAt: dayjs().format('YYYY-MM-DD'),
            },
          ],
        })),

      updateStore: (id, store) =>
        set((state) => ({
          stores: state.stores.map((s) =>
            s.id === id ? { ...s, ...store, updatedAt: dayjs().format('YYYY-MM-DD') } : s,
          ),
        })),

      deactivateStore: (id) =>
        set((state) => ({
          stores: state.stores.map((s) =>
            s.id === id
              ? { ...s, isActive: false, status: '已闭店', updatedAt: dayjs().format('YYYY-MM-DD') }
              : s,
          ),
        })),

      addEmployee: (emp) =>
        set((state) => ({
          employees: [...state.employees, { ...emp, id: generateId() }],
        })),

      updateEmployee: (id, emp) =>
        set((state) => ({
          employees: state.employees.map((e) => (e.id === id ? { ...e, ...emp } : e)),
        })),

      deactivateEmployee: (id) =>
        set((state) => ({
          employees: state.employees.map((e) => (e.id === id ? { ...e, isActive: false } : e)),
        })),

      addShiftType: (st) =>
        set((state) => ({
          shiftTypes: [
            ...state.shiftTypes,
            { ...st, id: generateId(), updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') },
          ],
        })),

      updateShiftType: (id, st) =>
        set((state) => ({
          shiftTypes: state.shiftTypes.map((s) =>
            s.id === id ? { ...s, ...st, updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') } : s,
          ),
        })),

      deactivateShiftType: (id) =>
        set((state) => ({
          shiftTypes: state.shiftTypes.map((s) =>
            s.id === id ? { ...s, isActive: false } : s,
          ),
        })),

      addShift: (shift) =>
        set((state) => ({
          shifts: [
            ...state.shifts,
            { ...shift, id: generateId(), createdAt: dayjs().format('YYYY-MM-DD') },
          ],
        })),

      updateShift: (id, shift) =>
        set((state) => ({
          shifts: state.shifts.map((s) => (s.id === id ? { ...s, ...shift } : s)),
        })),

      deactivateShift: (id) =>
        set((state) => ({
          shifts: state.shifts.map((s) => (s.id === id ? { ...s, isActive: false } : s)),
        })),

      addSchedule: (schedule) =>
        set((state) => ({
          schedules: [
            ...state.schedules,
            { ...schedule, id: generateId(), createdAt: dayjs().format('YYYY-MM-DD') },
          ],
        })),

      addScheduleFromApi: (schedule) =>
        set((state) => ({
          schedules: [...state.schedules, schedule],
        })),

      addRegionFromApi: (region) =>
        set((state) => ({
          regions: state.regions.some((r) => r.id === region.id) ? state.regions.map((r) => (r.id === region.id ? region : r)) : [...state.regions, region],
        })),

      addStoreFromApi: (store) =>
        set((state) => ({
          stores: state.stores.some((s) => s.id === store.id) ? state.stores.map((s) => (s.id === store.id ? store : s)) : [...state.stores, store],
        })),

      addEmployeeFromApi: (emp) =>
        set((state) => ({
          employees: state.employees.some((e) => e.id === emp.id) ? state.employees.map((e) => (e.id === emp.id ? { ...emp, password: emp.password || 'ohmee2026' } : e)) : [...state.employees, { ...emp, password: emp.password || 'ohmee2026' }],
        })),

      addShiftTypeFromApi: (st) =>
        set((state) => ({
          shiftTypes: state.shiftTypes.some((s) => s.id === st.id) ? state.shiftTypes.map((s) => (s.id === st.id ? st : s)) : [...state.shiftTypes, st],
        })),

      addShiftFromApi: (shift) =>
        set((state) => ({
          shifts: state.shifts.some((s) => s.id === shift.id) ? state.shifts.map((s) => (s.id === shift.id ? shift : s)) : [...state.shifts, shift],
        })),

      addTransferFromApi: (transfer) =>
        set((state) => ({
          transfers: state.transfers.some((t) => t.id === transfer.id) ? state.transfers.map((t) => (t.id === transfer.id ? transfer : t)) : [...state.transfers, transfer],
        })),

      addHandoverFromApi: (record) =>
        set((state) => ({
          handovers: state.handovers.some((h) => h.id === record.id) ? state.handovers.map((h) => (h.id === record.id ? record : h)) : [...state.handovers, record],
        })),

      addCountryFromApi: (country) =>
        set((state) => ({
          countries: state.countries.some((c) => c.id === country.id) ? state.countries.map((c) => (c.id === country.id ? country : c)) : [...state.countries, country],
        })),

      addCompanyFromApi: (company) =>
        set((state) => ({
          companies: state.companies.some((c) => c.id === company.id) ? state.companies.map((c) => (c.id === company.id ? company : c)) : [...state.companies, company],
        })),

      addRoleFromApi: (role) =>
        set((state) => ({
          roles: state.roles.some((r) => r.id === role.id) ? state.roles.map((r) => (r.id === role.id ? role : r)) : [...state.roles, role],
        })),

      deleteSchedule: (id) =>
        set((state) => ({
          schedules: state.schedules.filter((s) => s.id !== id),
        })),

      addAttendance: (record) =>
        set((state) => ({
          attendances: [...state.attendances, { ...record, id: generateId() }],
        })),

      addAttendanceFromApi: (record) =>
        set((state) => ({
          attendances: state.attendances.some((a) => a.id === record.id)
            ? state.attendances.map((a) => (a.id === record.id ? { ...a, ...record } : a))
            : [...state.attendances, record],
        })),

      updateAttendance: (id, record) =>
        set((state) => ({
          attendances: state.attendances.map((a) => (a.id === id ? { ...a, ...record } : a)),
        })),

      addTransfer: (transfer) =>
        set((state) => ({
          transfers: [
            ...state.transfers,
            {
              ...transfer,
              id: generateId(),
              createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
              updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            },
          ],
        })),

      approveTransfer: (id, approverId) =>
        set((state) => ({
          transfers: state.transfers.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: '已批准' as const,
                  approvedBy: approverId,
                  updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                }
              : t,
          ),
        })),

      rejectTransfer: (id, approverId, reason) =>
        set((state) => ({
          transfers: state.transfers.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: '已拒绝' as const,
                  approvedBy: approverId,
                  rejectReason: reason,
                  updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                }
              : t,
          ),
        })),

      addHandover: (record) =>
        set((state) => ({
          handovers: [
            ...state.handovers,
            {
              ...record,
              id: generateId(),
              createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
              updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            },
          ],
        })),

      confirmHandover: (id, reviewerId) =>
        set((state) => ({
          handovers: state.handovers.map((h) =>
            h.id === id
              ? { ...h, status: '已确认' as const, reviewedBy: reviewerId, updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') }
              : h,
          ),
        })),

      rejectHandover: (id, reviewerId, note) =>
        set((state) => ({
          handovers: state.handovers.map((h) =>
            h.id === id
              ? { ...h, status: '已驳回' as const, reviewedBy: reviewerId, reviewNote: note, updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') }
              : h,
          ),
        })),

      login: (user) =>
        set({
          currentUser: user,
          supervisorViewStoreId: user.role === '督导' ? user.storeId : null,
          selectedCompanyId: user.companyId,
          selectedCountryId: get().companies.find((c) => c.id === user.companyId)?.countryId || get().selectedCountryId,
        }),
      logout: () => set({ currentUser: null, supervisorViewStoreId: null }),

      hydrateFromApi: (data) =>
        set((state) => ({
          countries: data.countries ?? state.countries,
          companies: data.companies ?? state.companies,
          regions: data.regions ?? state.regions,
          stores: data.stores ?? state.stores,
          employees: (data.employees ?? state.employees).map((e) => ({
            ...e,
            password: e.password && e.password !== '***' ? e.password : 'ohmee2026',
          })),
          shiftTypes: data.shiftTypes ?? state.shiftTypes,
          shifts: data.shifts ?? state.shifts,
          schedules: data.schedules ?? state.schedules,
          attendances: data.attendances ?? state.attendances,
          transfers: data.transfers ?? state.transfers,
          handovers: data.handovers ?? state.handovers,
          roles: data.roles ?? state.roles,
        })),

      setSupervisorViewStoreId: (storeId) =>
        set({ supervisorViewStoreId: storeId }),

      setSelectedCompany: (companyId) =>
        set({ selectedCompanyId: companyId }),

      setSelectedCountry: (countryId) =>
        set((state) => {
          const companiesInCountry = state.companies.filter((c) => c.countryId === countryId && c.isActive)
          const firstCompanyId = companiesInCountry[0]?.id || null
          return {
            selectedCountryId: countryId,
            selectedCompanyId: firstCompanyId,
          }
        }),

      getStoreEmployees: (storeId) => {
        const { employees } = get()
        return employees.filter((e) => e.storeId === storeId && e.isActive)
      },

      getTransferredInEmployees: (storeId, date) => {
        const { transfers, employees } = get()
        const checkDate = date || dayjs().format('YYYY-MM-DD')
        const activeTransfers = transfers.filter(
          (t) =>
            t.toStoreId === storeId &&
            t.status === '已批准' &&
            t.startDate <= checkDate &&
            t.endDate >= checkDate,
        )
        return activeTransfers
          .map((t) => employees.find((e) => e.id === t.empId))
          .filter(Boolean) as Employee[]
      },

      getEffectiveStore: (empId, date) => {
        const { transfers, employees } = get()
        const checkDate = date || dayjs().format('YYYY-MM-DD')
        const activeTransfer = transfers.find(
          (t) =>
            t.empId === empId &&
            t.status === '已批准' &&
            t.startDate <= checkDate &&
            t.endDate >= checkDate,
        )
        if (activeTransfer) return activeTransfer.toStoreId
        return employees.find((e) => e.id === empId)?.storeId || ''
      },

      getStoresByCompany: (companyId) =>
        get().stores.filter((s) => s.companyId === companyId && s.isActive),

      getRegionsByCompany: (companyId) =>
        get().regions.filter((r) => r.companyId === companyId),

      getEmployeesByCompany: (companyId) =>
        get().employees.filter((e) => e.companyId === companyId && e.isActive),

      getScopedRegions: (companyId) => {
        const { regions, currentUser, roles } = get()
        if (!currentUser || currentUser.companyId !== companyId) return []
        const role = currentUser.roleId ? roles.find((r) => r.id === currentUser.roleId) : null
        const scope = role ? role.dataScope : getDataScope(currentUser.role)
        if (scope === 'country' || scope === 'company') return regions.filter((r) => r.companyId === companyId)
        if (scope === 'region' || scope === 'store') {
          if (role && currentUser.assignedRegionIds?.length) return regions.filter((r) => currentUser.assignedRegionIds!.includes(r.id))
          const scopedStores = get().getScopedStores(companyId)
          const regionIds = [...new Set(scopedStores.map((s) => s.regionId))]
          return regions.filter((r) => regionIds.includes(r.id))
        }
        return []
      },

      getScopedStores: (companyId) => {
        const { stores, currentUser, roles } = get()
        if (!currentUser || currentUser.companyId !== companyId) return []
        const role = currentUser.roleId ? roles.find((r) => r.id === currentUser.roleId) : null
        const scope = role ? role.dataScope : getDataScope(currentUser.role)
        const inCompany = stores.filter((s) => s.companyId === companyId && s.isActive)
        if (scope === 'country' || scope === 'company') return inCompany
        if (scope === 'region') {
          if (role && currentUser.assignedRegionIds?.length) {
            const regionStoreIds = inCompany.filter((s) => currentUser.assignedRegionIds!.includes(s.regionId)).map((s) => s.id)
            if (currentUser.assignedStoreIds?.length) return inCompany.filter((s) => currentUser.assignedStoreIds!.includes(s.id))
            return inCompany.filter((s) => regionStoreIds.includes(s.id))
          }
          return inCompany.filter((s) => s.supervisorId === currentUser.id)
        }
        if (scope === 'store') {
          if (role && currentUser.assignedStoreIds?.length) return inCompany.filter((s) => currentUser.assignedStoreIds!.includes(s.id))
          return inCompany.filter((s) => s.id === currentUser.storeId)
        }
        return []
      },

      getScopedEmployees: (companyId) => {
        const { employees, currentUser } = get()
        if (!currentUser || currentUser.companyId !== companyId) return []
        const scope = getDataScope(currentUser.role)
        const inCompany = employees.filter((e) => e.companyId === companyId && e.isActive)
        if (scope === 'country' || scope === 'company') return inCompany
        if (scope === 'region') {
          const scopedStoreIds = get().getScopedStores(companyId).map((s) => s.id)
          return inCompany.filter((e) => scopedStoreIds.includes(e.storeId))
        }
        if (scope === 'store') return inCompany.filter((e) => e.storeId === currentUser.storeId)
        if (scope === 'self') return inCompany.filter((e) => e.id === currentUser.id)
        return []
      },

      getScopedHandovers: (companyId) => {
        const { handovers, currentUser } = get()
        if (!currentUser || currentUser.companyId !== companyId) return []
        const scope = getDataScope(currentUser.role)
        const inCompany = handovers.filter((h) => h.companyId === companyId)
        if (scope === 'country' || scope === 'company') return inCompany
        if (scope === 'region') {
          const storeIds = get().getScopedStores(companyId).map((s) => s.id)
          return inCompany.filter((h) => storeIds.includes(h.storeId))
        }
        if (scope === 'store') return inCompany.filter((h) => h.storeId === currentUser.storeId)
        return []
      },

      getScopedShiftTypes: (companyId) => {
        const { shiftTypes, currentUser } = get()
        if (!currentUser || currentUser.companyId !== companyId) return []
        return shiftTypes.filter((st) => st.companyId === companyId && st.isActive)
      },

      getRolesByCompany: (companyId) =>
        get().roles.filter((r) => r.companyId === companyId && r.isActive),
    }),
    {
      name: 'ohmee-store',
    },
  ),
)
