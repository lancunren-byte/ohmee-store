import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

import AppUpdateChecker from './components/AppUpdateChecker'
import PCLayout from './components/pc/PCLayout'
import MobileLayout from './components/mobile/MobileLayout'
import PCLogin from './pages/pc/PCLogin'
import PCDashboard from './pages/pc/PCDashboard'
import StoreManagement from './pages/pc/StoreManagement'
import RegionManagement from './pages/pc/RegionManagement'
import EmployeeManagement from './pages/pc/EmployeeManagement'
import ShiftTypeConfig from './pages/pc/ShiftTypeConfig'
import ShiftList from './pages/pc/ShiftList'
import ScheduleList from './pages/pc/ScheduleList'
import WorkHours from './pages/pc/WorkHours'
import AttendanceExport from './pages/pc/AttendanceExport'
import HandoverQuery from './pages/pc/HandoverQuery'
import TaskConfig from './pages/pc/TaskConfig'
import TaskStats from './pages/pc/TaskStats'
import TaskDispatch from './pages/pc/TaskDispatch'
import RecruitStats from './pages/pc/RecruitStats'
import PermissionManagement from './pages/pc/PermissionManagement'

import MobileLogin from './pages/mobile/MobileLogin'
import MobileHome from './pages/mobile/MobileHome'
import MobileAttendance from './pages/mobile/MobileAttendance'
import MobileHandover from './pages/mobile/MobileHandover'
import MobileCheckIn from './pages/mobile/MobileCheckIn'
import MobileCreateShift from './pages/mobile/MobileCreateShift'
import MobileScheduling from './pages/mobile/MobileScheduling'
import MobileTransfer from './pages/mobile/MobileTransfer'
import MobileDashboard from './pages/mobile/MobileDashboard'
import MobileProfile from './pages/mobile/MobileProfile'
import MobileTasks from './pages/mobile/MobileTasks'
import MobileRecruit from './pages/mobile/MobileRecruit'
import { useAppStore } from './store'

dayjs.locale('zh-cn')

function MobileGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { currentUser } = useAppStore()
  if (!currentUser) {
    return <Navigate to="/mobile/login" replace />
  }
  return <>{children}</>
}

function RootRedirect() {
  const isMobile = window.innerWidth < 768
  const { currentUser } = useAppStore()
  if (isMobile) return <Navigate to="/mobile/login" replace />
  return <Navigate to={currentUser ? '/pc' : '/pc/login'} replace />
}

function PCGuard({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAppStore()
  if (!currentUser) {
    return <Navigate to="/pc/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1677ff' } }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          {/* PC Login */}
          <Route path="/pc/login" element={<PCLogin />} />

          {/* PC Routes with Auth Guard */}
          <Route
            path="/pc"
            element={
              <PCGuard>
                <PCLayout />
              </PCGuard>
            }
          >
            <Route index element={<PCDashboard />} />
            <Route path="stores" element={<StoreManagement />} />
            <Route path="regions" element={<RegionManagement />} />
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="shift-types" element={<ShiftTypeConfig />} />
            <Route path="shifts" element={<ShiftList />} />
            <Route path="schedules" element={<ScheduleList />} />
            <Route path="work-hours" element={<WorkHours />} />
            <Route path="attendance-export" element={<AttendanceExport />} />
            <Route path="handover" element={<HandoverQuery />} />
            <Route path="tasks" element={<TaskConfig />} />
            <Route path="task-stats" element={<TaskStats />} />
            <Route path="task-dispatch" element={<TaskDispatch />} />
            <Route path="recruit" element={<RecruitStats />} />
            <Route path="permissions" element={<PermissionManagement />} />
          </Route>

          {/* Mobile Login */}
          <Route path="/mobile/login" element={<MobileLogin />} />

          {/* Mobile Routes with Auth Guard */}
          <Route
            path="/mobile"
            element={
              <MobileGuard>
                <MobileLayout />
              </MobileGuard>
            }
          >
            <Route index element={<Navigate to="/mobile/home" replace />} />
            <Route path="home" element={<MobileHome />} />
            <Route path="attendance" element={<MobileAttendance />} />
            <Route path="create-shift" element={<MobileCreateShift />} />
            <Route path="scheduling" element={<MobileScheduling />} />
            <Route path="transfer" element={<MobileTransfer />} />
            <Route path="dashboard" element={<MobileDashboard />} />
            <Route path="handover" element={<MobileHandover />} />
            <Route path="tasks" element={<MobileTasks />} />
            <Route path="recruit" element={<MobileRecruit />} />
            <Route path="profile" element={<MobileProfile />} />
          </Route>

          {/* Check-in page outside layout (full screen) */}
          <Route
            path="/mobile/checkin"
            element={
              <MobileGuard>
                <MobileCheckIn />
              </MobileGuard>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <AppUpdateChecker />
      </BrowserRouter>
    </ConfigProvider>
  )
}
