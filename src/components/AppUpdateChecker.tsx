/**
 * APP 版本检查组件
 * 仅在 Capacitor 原生环境下生效，网页端跳过
 * 检测到新版本且 force_update=true 时显示强制更新弹窗
 */
import React, { useEffect, useState } from 'react'
import { Modal, Button } from 'antd-mobile'
import { APP_VERSION, APP_BUILD } from '../version'

const API_BASE = import.meta.env.VITE_API_URL || ''

interface ServerVersion {
  version: string
  build: number
  force_update: boolean
  apk_url: string
  release_notes: string
}

function compareVersion(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1
    if ((pa[i] || 0) < (pb[i] || 0)) return -1
  }
  return 0
}

const isCapacitorNative =
  typeof window !== 'undefined' &&
  !!(window as unknown as Record<string, unknown>).Capacitor &&
  (
    (window as unknown as Record<string, { isNative?: boolean }>).Capacitor
  )?.isNative === true

export default function AppUpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState<ServerVersion | null>(null)

  useEffect(() => {
    if (!isCapacitorNative) return

    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/app-version`)
        if (!res.ok) return
        const data: ServerVersion = await res.json()
        const isNewer =
          compareVersion(data.version, APP_VERSION) > 0 ||
          data.build > APP_BUILD
        if (isNewer && data.force_update) {
          setUpdateInfo(data)
        }
      } catch {
        // 网络失败时静默跳过，不影响正常使用
      }
    }

    check()
  }, [])

  if (!updateInfo) return null

  const handleUpdate = () => {
    // 在系统浏览器中打开下载链接，Android 会下载并提示安装
    window.open(updateInfo.apk_url, '_system')
  }

  return (
    <Modal
      visible
      closeOnMaskClick={false}
      title={
        <div style={{ textAlign: 'center', color: '#e6232a', fontWeight: 700 }}>
          发现新版本 v{updateInfo.version}
        </div>
      }
      content={
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 12, color: '#333' }}>
            为了给您提供最佳体验，请更新到最新版本
          </div>
          {updateInfo.release_notes && (
            <div
              style={{
                background: '#f5f5f5',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 13,
                color: '#666',
                textAlign: 'left',
                marginBottom: 8,
              }}
            >
              {updateInfo.release_notes}
            </div>
          )}
          <div style={{ fontSize: 12, color: '#999' }}>
            当前版本：v{APP_VERSION} → 最新版本：v{updateInfo.version}
          </div>
        </div>
      }
      actions={[
        {
          key: 'update',
          text: (
            <Button
              block
              color="primary"
              style={{ '--background-color': '#e6232a', '--border-radius': '8px' }}
            >
              立即更新
            </Button>
          ),
          onClick: handleUpdate,
        },
      ]}
    />
  )
}
