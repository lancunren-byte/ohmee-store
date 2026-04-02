import { useMemo } from 'react'
import { useAppStore } from '../store'
import {
  hasMenuPermission,
  hasButtonPermission,
  getDataScope,
  type PCMenuKey,
  type ButtonCode,
} from '../config/permissions'
import type { EmployeeRole } from '../types'

/** 权限 Hook：菜单、按钮、数据范围；支持可配置角色(roleId)与固定角色(role) */
export function usePermission() {
  const currentUser = useAppStore((s) => s.currentUser)
  const roles = useAppStore((s) => s.roles)
  const role = currentUser?.role ?? ('全职店员' as EmployeeRole)
  const configRole = currentUser?.roleId ? roles.find((r) => r.id === currentUser.roleId) : null

  const can = useMemo(
    () => ({
      menu: (key: PCMenuKey) =>
        configRole ? configRole.menuKeys.includes(key) : hasMenuPermission(role, key),
      button: (code: ButtonCode) =>
        configRole ? configRole.buttonCodes.includes(code) : hasButtonPermission(role, code),
    }),
    [role, configRole],
  )

  const dataScope = useMemo(
    () => (configRole ? configRole.dataScope : getDataScope(role)),
    [role, configRole],
  )

  return { currentUser, role, configRole, can, dataScope }
}
