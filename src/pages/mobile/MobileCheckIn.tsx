import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { NavBar, Button, Toast, SpinLoading, Tag, Dialog } from 'antd-mobile'
import {
  CameraOutline,
  LocationOutline,
  CheckCircleOutline,
  CloseCircleOutline,
} from 'antd-mobile-icons'
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera'
import { Geolocation } from '@capacitor/geolocation'
import { useAppStore } from '../../store'
import { calculateDistance, isLate, isEarlyLeave } from '../../utils/helpers'
import { isApiMode, apiCheckIn } from '../../api/client'
import dayjs from 'dayjs'
import { AttendanceStatus } from '../../types'

type CheckPhase = 'init' | 'preview' | 'locating' | 'done' | 'error'

export default function MobileCheckIn() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const date = searchParams.get('date') || dayjs().format('YYYY-MM-DD')
  const scheduleId = searchParams.get('scheduleId') || ''

  const { currentUser, schedules, shifts, stores, attendances, addAttendance, addAttendanceFromApi, updateAttendance } =
    useAppStore()

  const [phase, setPhase] = useState<CheckPhase>('init')
  const [capturedPhoto, setCapturedPhoto] = useState<string>('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState('')
  const [checkType, setCheckType] = useState<'上班打卡' | '下班打卡'>('上班打卡')
  const [buttonText, setButtonText] = useState('上班打卡')
  const [hintText, setHintText] = useState<string | null>(null)
  const [isMissingCheckIn, setIsMissingCheckIn] = useState(false)

  const schedule = schedules.find((s) => s.id === scheduleId)
  const shift = schedule ? shifts.find((s) => s.id === schedule.shiftId) : null
  const effectiveStoreId = schedule?.storeId || currentUser?.storeId || ''
  const store = stores.find((s) => s.id === effectiveStoreId)

  const existingAttendance = attendances.find(
    (a) => a.empId === currentUser?.id && a.date === date,
  )

  useEffect(() => {
    if (!shift) return
    const hasCheckIn = !!existingAttendance?.checkInTime
    const hasCheckOut = !!existingAttendance?.checkOutTime
    const now = dayjs()
    const shiftStart = dayjs(`${date} ${shift.startTime}`)
    const shiftEnd = dayjs(`${date} ${shift.endTime}`)
    const hoursAfterStart = now.diff(shiftStart, 'hour', true)

    if (hasCheckOut) {
      return
    }
    if (hasCheckIn) {
      setCheckType('下班打卡')
      setIsMissingCheckIn(false)
      if (now.isBefore(shiftEnd)) {
        setButtonText('早退打卡')
        setHintText(`当前时间早于班次结束时间 ${shift.endTime}，将记录为早退`)
      } else {
        setButtonText('下班打卡')
        setHintText(null)
      }
    } else {
      if (hoursAfterStart >= 4) {
        setCheckType('下班打卡')
        setButtonText('下班打卡')
        setHintText('上班打卡缺卡')
        setIsMissingCheckIn(true)
      } else if (now.isAfter(shiftStart)) {
        setCheckType('上班打卡')
        setButtonText('迟到打卡')
        setHintText(`当前时间晚于班次开始时间 ${shift.startTime}`)
        setIsMissingCheckIn(false)
      } else {
        setCheckType('上班打卡')
        setButtonText('上班打卡')
        setHintText(null)
        setIsMissingCheckIn(false)
      }
    }
  }, [existingAttendance, shift, date])

  const takePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        direction: CameraDirection.Front,
        promptLabelHeader: '拍照打卡',
        promptLabelCancel: '取消',
        promptLabelPhoto: '从相册选取',
        promptLabelPicture: '拍照',
      })
      if (photo.base64String) {
        setCapturedPhoto(`data:image/jpeg;base64,${photo.base64String}`)
        setPhase('preview')
      }
    } catch (err: any) {
      if (err?.message !== 'User cancelled photos app') {
        Toast.show({ content: '无法启动摄像头，请检查相机权限', icon: 'fail', duration: 3000 })
      }
    }
  }

  const retakePhoto = () => {
    setCapturedPhoto('')
    takePhoto()
  }

  const confirmPhotoAndLocate = async () => {
    setPhase('locating')
    try {
      const pos = await Geolocation.getCurrentPosition({
        timeout: 10000,
        enableHighAccuracy: true,
      })
      const { latitude, longitude } = pos.coords
      setLocation({ lat: latitude, lng: longitude })
      handleCheckIn(latitude, longitude)
    } catch {
      setLocationError('无法获取位置，请在手机设置中开启定位权限')
      setPhase('error')
    }
  }

  const handleCheckIn = (lat: number, lng: number) => {
    if (!currentUser || !store || !shift) {
      Toast.show({ content: '数据异常，请返回重试', icon: 'fail' })
      setPhase('error')
      return
    }

    const distance = calculateDistance(lat, lng, store.lat, store.lng)
    if (distance > 100) {
      Dialog.alert({
        title: '打卡失败',
        content: `您距离门店 ${Math.round(distance)} 米，超出100米范围，无法打卡。`,
        confirmText: '我知道了',
        onConfirm: () => setPhase('init'),
      })
      return
    }

    const now = dayjs()
    const timeStr = now.format('HH:mm')

    if (checkType === '上班打卡') {
      const late = isLate(timeStr, shift.startTime)
      const status: AttendanceStatus = late ? '迟到' : '正常'

      if (late) {
        Dialog.confirm({
          title: '迟到提醒',
          content: `当前时间 ${timeStr}，班次开始时间 ${shift.startTime}，将记录为【迟到打卡】`,
          confirmText: '确认打卡',
          cancelText: '取消',
          onConfirm: () => {
            saveCheckIn(lat, lng, timeStr, status, late, false)
          },
          onCancel: () => setPhase('preview'),
        })
      } else {
        saveCheckIn(lat, lng, timeStr, status, false, false)
      }
    } else {
      const early = isEarlyLeave(timeStr, shift.endTime)
      const baseStatus = isMissingCheckIn
        ? '缺勤'
        : existingAttendance?.isLate
          ? '迟到'
          : '正常'
      const status: AttendanceStatus =
        early && baseStatus === '迟到' ? '迟到早退' : early ? '早退' : baseStatus

      if (isMissingCheckIn) {
        Dialog.confirm({
          title: '上班打卡缺卡',
          content: `您今日未打上班卡，将直接记录下班打卡，状态为【缺勤】。确认继续？`,
          confirmText: '确认打卡',
          cancelText: '取消',
          onConfirm: () => {
            saveCheckOut(lat, lng, timeStr, '缺勤' as AttendanceStatus, false, true)
          },
          onCancel: () => setPhase('preview'),
        })
      } else if (early) {
        Dialog.confirm({
          title: '早退提醒',
          content: `当前时间 ${timeStr}，班次结束时间 ${shift.endTime}，将记录为【早退打卡】`,
          confirmText: '确认打卡',
          cancelText: '取消',
          onConfirm: () => {
            saveCheckOut(lat, lng, timeStr, status, early)
          },
          onCancel: () => setPhase('preview'),
        })
      } else {
        saveCheckOut(lat, lng, timeStr, status, false)
      }
    }
  }

  const saveCheckIn = async (
    lat: number,
    lng: number,
    timeStr: string,
    status: AttendanceStatus,
    isLateFlag: boolean,
    _: boolean,
  ) => {
    const payload = {
      empId: currentUser!.id,
      scheduleId,
      shiftId: shift!.id,
      date,
      checkInTime: timeStr,
      checkInPhoto: capturedPhoto,
      checkInLat: lat,
      checkInLng: lng,
      status,
      storeId: effectiveStoreId,
      isLate: isLateFlag,
      isEarlyLeave: false,
      note: isLateFlag ? `迟到打卡，班次开始时间${shift!.startTime}` : '',
    }
    try {
      if (isApiMode()) {
        const res = await apiCheckIn(payload)
        addAttendanceFromApi({ ...payload, id: res.id })
      } else {
        addAttendance(payload)
      }
      setPhase('done')
      Toast.show({
        content: isLateFlag ? '迟到打卡已记录' : '上班打卡成功',
        icon: isLateFlag ? 'fail' : 'success',
      })
    } catch (e) {
      Toast.show({ content: e instanceof Error ? e.message : '打卡失败', icon: 'fail' })
      setPhase('preview')
    }
  }

  const saveCheckOut = async (
    lat: number,
    lng: number,
    timeStr: string,
    status: AttendanceStatus,
    isEarlyFlag: boolean,
    missingCheckInNote?: boolean,
  ) => {
    const note = missingCheckInNote
      ? '上班打卡缺卡'
      : isEarlyFlag
        ? `早退打卡，班次结束时间${shift!.endTime}`
        : ''
    const updatePayload = {
      checkOutTime: timeStr,
      checkOutPhoto: capturedPhoto,
      checkOutLat: lat,
      checkOutLng: lng,
      status,
      isEarlyLeave: isEarlyFlag,
      note,
    }
    try {
      if (isApiMode()) {
        await apiCheckIn({
          empId: currentUser!.id,
          scheduleId,
          shiftId: shift!.id,
          date,
          checkInTime: existingAttendance?.checkInTime,
          checkOutTime: timeStr,
          checkInPhoto: existingAttendance?.checkInPhoto,
          checkOutPhoto: capturedPhoto,
          checkInLat: existingAttendance?.checkInLat,
          checkInLng: existingAttendance?.checkInLng,
          checkOutLat: lat,
          checkOutLng: lng,
          status,
          storeId: effectiveStoreId,
          isLate: existingAttendance?.isLate ?? false,
          isEarlyLeave: isEarlyFlag,
          note: updatePayload.note,
        })
      }
      if (existingAttendance) {
        updateAttendance(existingAttendance.id, updatePayload)
      } else {
        const payload = {
          empId: currentUser!.id,
          scheduleId,
          shiftId: shift!.id,
          date,
          checkOutTime: timeStr,
          checkOutPhoto: capturedPhoto,
          checkOutLat: lat,
          checkOutLng: lng,
          status,
          storeId: effectiveStoreId,
          isLate: false,
          isEarlyLeave: isEarlyFlag,
          note: updatePayload.note,
        }
        if (isApiMode()) {
          const res = await apiCheckIn(payload)
          addAttendanceFromApi({ ...payload, id: res.id })
        } else {
          addAttendance(payload)
        }
      }
      setPhase('done')
      const msg = missingCheckInNote ? '下班打卡已记录（上班缺卡）' : isEarlyFlag ? '早退打卡已记录' : '下班打卡成功'
      Toast.show({
        content: msg,
        icon: isEarlyFlag || missingCheckInNote ? 'fail' : 'success',
      })
    } catch (e) {
      Toast.show({ content: e instanceof Error ? e.message : '打卡失败', icon: 'fail' })
      setPhase('preview')
    }
  }

  const statusColors: Record<AttendanceStatus, string> = {
    正常: '#52c41a',
    迟到: '#faad14',
    早退: '#fa8c16',
    迟到早退: '#ff4d4f',
    缺勤: '#ff4d4f',
    未打卡: '#999',
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f5f5',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        @keyframes camera-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(1.05); }
        }
        .camera-icon-flash {
          animation: camera-pulse 1.5s ease-in-out infinite;
        }
      `}</style>
      <NavBar
        onBack={() => navigate(-1)}
        style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}
      >
        {checkType}
      </NavBar>

      {shift && (
        <div
          style={{
            background: '#fff',
            margin: 12,
            borderRadius: 12,
            padding: '14px 16px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{shift.shiftName}</div>
              <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
                📅 {date} · 🏪 {store?.storeName}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: '#999' }}>
                {shift.startTime} — {shift.endTime}
              </div>
              {existingAttendance?.checkInTime && (
                <div style={{ fontSize: 12, color: '#52c41a', marginTop: 2 }}>
                  ✓ 上班: {existingAttendance.checkInTime}
                </div>
              )}
              {existingAttendance?.checkOutTime && (
                <div style={{ fontSize: 12, color: '#1677ff', marginTop: 2 }}>
                  ✓ 下班: {existingAttendance.checkOutTime}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column' }}>
        {phase === 'init' && (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            {existingAttendance?.checkInTime && existingAttendance?.checkOutTime ? (
              <div>
                <CheckCircleOutline style={{ fontSize: 64, color: '#52c41a' }} />
                <div style={{ fontSize: 16, fontWeight: 600, marginTop: 16 }}>今日打卡已完成</div>
                <div style={{ color: '#999', fontSize: 14, marginTop: 8 }}>
                  上班: {existingAttendance.checkInTime} · 下班: {existingAttendance.checkOutTime}
                </div>
                <Tag
                  color={statusColors[existingAttendance.status]}
                  style={{ marginTop: 12, fontSize: 14, padding: '4px 16px' }}
                >
                  {existingAttendance.status}
                </Tag>
              </div>
            ) : (
              <div>
                <div
                  className="camera-icon-flash"
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1677ff 0%, #0050b3 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    boxShadow: '0 8px 24px rgba(22,119,255,0.3)',
                    cursor: 'pointer',
                  }}
                  onClick={takePhoto}
                >
                  <CameraOutline style={{ fontSize: 48, color: '#fff' }} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                  点击拍照打卡
                </div>
                <div style={{ fontSize: 14, color: '#999' }}>
                  {checkType === '上班打卡'
                    ? `班次开始时间: ${shift?.startTime || '--'}`
                    : `班次结束时间: ${shift?.endTime || '--'}`}
                </div>
                {hintText && (
                  <div style={{ fontSize: 13, color: '#ff4d4f', marginTop: 6 }}>
                    {hintText}
                  </div>
                )}
                <div style={{ fontSize: 13, color: '#ff4d4f', marginTop: 8 }}>
                  打卡需在门店100米范围内
                </div>

                <Button
                  color="primary"
                  size="large"
                  block
                  style={{ marginTop: 32, borderRadius: 8 }}
                  onClick={takePhoto}
                >
                  <CameraOutline style={{ marginRight: 8 }} />
                  {buttonText}
                </Button>
              </div>
            )}
          </div>
        )}

        {phase === 'preview' && (
          <div>
            <img
              src={capturedPhoto}
              alt="打卡照片"
              style={{ width: '100%', borderRadius: 12, maxHeight: 360, objectFit: 'cover' }}
            />
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <Button block fill="outline" onClick={retakePhoto}>
                重新拍照
              </Button>
              <Button color="primary" block size="large" onClick={confirmPhotoAndLocate}>
                <LocationOutline style={{ marginRight: 8 }} />
                确认打卡
              </Button>
            </div>
          </div>
        )}

        {phase === 'locating' && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <SpinLoading style={{ '--size': '48px', '--color': '#1677ff' }} />
            <div style={{ marginTop: 16, color: '#666', fontSize: 15 }}>
              正在获取位置信息...
            </div>
            <div style={{ marginTop: 8, color: '#999', fontSize: 13 }}>
              请稍候，系统正在验证您的位置
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <CheckCircleOutline style={{ fontSize: 72, color: '#52c41a' }} />
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 16, color: '#333' }}>
              打卡成功！
            </div>
            <div style={{ color: '#666', fontSize: 14, marginTop: 8 }}>
              {checkType} · {dayjs().format('HH:mm:ss')}
            </div>
            {capturedPhoto && (
              <img
                src={capturedPhoto}
                alt="打卡照片"
                style={{ width: 80, height: 80, borderRadius: 8, marginTop: 16, objectFit: 'cover' }}
              />
            )}
            <Button
              color="primary"
              block
              style={{ marginTop: 32, borderRadius: 8 }}
              onClick={() => navigate('/mobile/attendance')}
            >
              返回打卡记录
            </Button>
          </div>
        )}

        {phase === 'error' && (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <CloseCircleOutline style={{ fontSize: 72, color: '#ff4d4f' }} />
            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 16, color: '#ff4d4f' }}>
              打卡失败
            </div>
            <div style={{ color: '#666', fontSize: 14, marginTop: 8 }}>{locationError}</div>
            <Button
              color="primary"
              block
              fill="outline"
              style={{ marginTop: 32, borderRadius: 8 }}
              onClick={() => {
                setPhase('init')
                setLocationError('')
              }}
            >
              重试
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
