import React, { useState } from 'react'
import { Popup, SearchBar } from 'antd-mobile'
import { useAppStore } from '../../store'
import { usePermission } from '../../hooks/usePermission'

interface StoreSwitcherProps {
  value: string
  onChange: (storeId: string) => void
}

export default function StoreSwitcher({ value, onChange }: StoreSwitcherProps) {
  const [visible, setVisible] = useState(false)
  const [search, setSearch] = useState('')
  const { stores, currentUser, getScopedStores } = useAppStore()
  const { can } = usePermission()

  if (!currentUser || !can.button('mobile:storeSwitch')) return null

  const supervisedStores = currentUser.companyId
    ? getScopedStores(currentUser.companyId).filter((s) => s.status === '营业中')
    : stores.filter(
        (s) =>
          s.supervisorId === currentUser.id &&
          s.companyId === currentUser.companyId &&
          s.isActive &&
          s.status === '营业中',
      )
  const filteredStores = search
    ? supervisedStores.filter(
        (s) =>
          s.storeName.includes(search) || s.storeNo.toLowerCase().includes(search.toLowerCase()),
      )
    : supervisedStores
  const currentStore = stores.find((s) => s.id === value)

  return (
    <>
      <div
        onClick={() => setVisible(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          background: 'rgba(255,255,255,.2)',
          borderRadius: 8,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        <span>{currentStore?.storeName || '选择门店'}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      <Popup
        visible={visible}
        onMaskClick={() => setVisible(false)}
        position="bottom"
        bodyStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70vh' }}
      >
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>切换门店</div>
          <SearchBar
            placeholder="搜索门店名称或编号"
            value={search}
            onChange={setSearch}
            style={{ '--border-radius': '8px', marginBottom: 12 }}
          />
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {filteredStores.map((store) => (
              <div
                key={store.id}
                onClick={() => {
                  onChange(store.id)
                  setVisible(false)
                }}
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #f0f0f0',
                  color: store.id === value ? '#e6232a' : '#333',
                  fontWeight: store.id === value ? 600 : 400,
                }}
              >
                {store.storeName}（{store.storeNo}）
              </div>
            ))}
          </div>
        </div>
      </Popup>
    </>
  )
}
