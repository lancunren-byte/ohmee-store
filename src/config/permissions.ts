import type { EmployeeRole, DataScope } from '../types'

export type { DataScope }

/** PC 端菜单 key（与路由一致） */
export type PCMenuKey =
  | '/pc'
  | '/pc/stores'
  | '/pc/regions'
  | '/pc/employees'
  | '/pc/shift-types'
  | '/pc/shifts'
  | '/pc/schedules'
  | '/pc/work-hours'
  | '/pc/attendance-export'
  | '/pc/handover'
  | '/pc/permissions'
  | '/pc/tasks'
  | '/pc/task-stats'
  | '/pc/task-dispatch'
  | '/pc/recruit'

/** 按钮权限码 */
export type ButtonCode =
  | 'region:add'
  | 'region:edit'
  | 'region:delete'
  | 'store:add'
  | 'store:edit'
  | 'store:delete'
  | 'employee:add'
  | 'employee:edit'
  | 'employee:delete'
  | 'shiftType:add'
  | 'shiftType:edit'
  | 'shiftType:delete'
  | 'handover:view'
  | 'handover:export'
  | 'mobile:createShift'
  | 'mobile:scheduling'
  | 'mobile:transfer'
  | 'mobile:approveTransfer'
  | 'mobile:handover'
  | 'mobile:approveHandover'
  | 'mobile:recruit'
  | 'mobile:storeSwitch'

/** 角色对应的数据权限范围 */
export const ROLE_DATA_SCOPE: Record<EmployeeRole, DataScope> = {
  督导: 'region', // 所辖门店（通过 supervisorId 关联）
  稽核专员: 'company', // 公司级
  店长: 'store', // 本店
  全职店员: 'self',
  管培生: 'self',
  兼职店员: 'self',
}

/** 角色对应的 PC 菜单权限 */
export const ROLE_PC_MENUS: Record<EmployeeRole, PCMenuKey[]> = {
  督导: ['/pc', '/pc/stores', '/pc/regions', '/pc/employees', '/pc/shift-types', '/pc/shifts', '/pc/schedules', '/pc/work-hours', '/pc/attendance-export', '/pc/handover', '/pc/permissions', '/pc/tasks', '/pc/task-stats', '/pc/task-dispatch'],
  稽核专员: ['/pc', '/pc/stores', '/pc/regions', '/pc/employees', '/pc/shift-types', '/pc/shifts', '/pc/schedules', '/pc/work-hours', '/pc/attendance-export', '/pc/handover', '/pc/permissions', '/pc/tasks', '/pc/task-stats', '/pc/task-dispatch', '/pc/recruit'],
  店长: ['/pc', '/pc/handover'], // 店长可看概览、交接班查询
  全职店员: ['/pc'],
  管培生: ['/pc'],
  兼职店员: ['/pc'],
}

/** 角色对应的按钮权限 */
export const ROLE_BUTTONS: Record<EmployeeRole, ButtonCode[]> = {
  督导: [
    'region:add',
    'region:edit',
    'region:delete',
    'store:add',
    'store:edit',
    'store:delete',
    'employee:add',
    'employee:edit',
    'employee:delete',
    'shiftType:add',
    'shiftType:edit',
    'shiftType:delete',
    'handover:view',
    'handover:export',
    'mobile:createShift',
    'mobile:scheduling',
    'mobile:transfer',
    'mobile:approveTransfer',
    'mobile:handover',
    'mobile:approveHandover',
    'mobile:storeSwitch',
  ],
  稽核专员: [
    'region:add',
    'region:edit',
    'region:delete',
    'store:add',
    'store:edit',
    'store:delete',
    'employee:add',
    'employee:edit',
    'employee:delete',
    'shiftType:add',
    'shiftType:edit',
    'shiftType:delete',
    'handover:view',
    'handover:export',
  ],
  店长: [
    'handover:view',
    'mobile:createShift',
    'mobile:scheduling',
    'mobile:transfer',
    'mobile:approveTransfer',
    'mobile:handover',
    'mobile:approveHandover',
    'mobile:recruit',
  ],
  全职店员: [],
  管培生: [],
  兼职店员: [],
}

/** 检查角色是否有某菜单权限 */
export function hasMenuPermission(role: EmployeeRole, menuKey: PCMenuKey): boolean {
  return ROLE_PC_MENUS[role]?.includes(menuKey) ?? false
}

/** 检查角色是否有某按钮权限 */
export function hasButtonPermission(role: EmployeeRole, code: ButtonCode): boolean {
  return ROLE_BUTTONS[role]?.includes(code) ?? false
}

/** 获取角色的数据权限范围 */
export function getDataScope(role: EmployeeRole): DataScope {
  return ROLE_DATA_SCOPE[role] ?? 'self'
}

/** 所有可配置的菜单 key */
export const ALL_PC_MENU_KEYS: PCMenuKey[] = [
  '/pc',
  '/pc/stores',
  '/pc/regions',
  '/pc/employees',
  '/pc/shift-types',
  '/pc/shifts',
  '/pc/schedules',
  '/pc/work-hours',
  '/pc/attendance-export',
  '/pc/handover',
  '/pc/permissions',
  '/pc/tasks',
  '/pc/task-stats',
  '/pc/task-dispatch',
  '/pc/recruit',
]

/** 所有可配置的按钮码 */
export const ALL_BUTTON_CODES: ButtonCode[] = [
  'region:add',
  'region:edit',
  'region:delete',
  'store:add',
  'store:edit',
  'store:delete',
  'employee:add',
  'employee:edit',
  'employee:delete',
  'shiftType:add',
  'shiftType:edit',
  'shiftType:delete',
  'handover:view',
  'handover:export',
  'mobile:createShift',
  'mobile:scheduling',
  'mobile:transfer',
  'mobile:approveTransfer',
  'mobile:handover',
  'mobile:approveHandover',
  'mobile:recruit',
  'mobile:storeSwitch',
]
