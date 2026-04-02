"""打卡 API"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from backend.database import get_db
from backend.models import Attendance, Employee, Store, Shift
from backend.config import settings

router = APIRouter()


def _haversine(lat1, lon1, lat2, lon2):
    """计算两点距离（米）"""
    import math
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    c = 2*math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c


class CheckInRequest(BaseModel):
    empId: str
    scheduleId: str
    shiftId: str
    date: str
    checkInTime: str | None = None
    checkOutTime: str | None = None
    checkInPhoto: str | None = None
    checkOutPhoto: str | None = None
    checkInLat: float | None = None
    checkInLng: float | None = None
    checkOutLat: float | None = None
    checkOutLng: float | None = None
    status: str
    storeId: str
    isLate: bool = False
    isEarlyLeave: bool = False
    note: str | None = None


@router.post("/attendance")
def create_or_update_attendance(req: CheckInRequest, db: Session = Depends(get_db)):
    store = db.query(Store).filter(Store.id == req.storeId).first()
    if not store:
        raise HTTPException(400, "门店不存在")

    # 距离校验
    lat = req.checkInLat or req.checkOutLat
    lng = req.checkInLng or req.checkOutLng
    if lat is not None and lng is not None:
        dist = _haversine(lat, lng, store.lat, store.lng)
        if dist > settings.checkin_max_distance_meters:
            raise HTTPException(400, f"距离门店 {int(dist)} 米，超出 {settings.checkin_max_distance_meters} 米范围")

    existing = db.query(Attendance).filter(
        Attendance.emp_id == req.empId,
        Attendance.date == req.date,
    ).first()

    import uuid
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if existing:
        existing.check_out_time = req.checkOutTime or existing.check_out_time
        existing.check_out_photo = req.checkOutPhoto or existing.check_out_photo
        existing.check_out_lat = req.checkOutLat or existing.check_out_lat
        existing.check_out_lng = req.checkOutLng or existing.check_out_lng
        existing.status = req.status
        existing.is_early_leave = req.isEarlyLeave
        existing.note = req.note or existing.note
        db.commit()
        return {"success": True, "id": existing.id}
    else:
        att = Attendance(
            id=str(uuid.uuid4()),
            emp_id=req.empId,
            schedule_id=req.scheduleId,
            shift_id=req.shiftId,
            date=req.date,
            check_in_time=req.checkInTime,
            check_in_photo=req.checkInPhoto,
            check_in_lat=req.checkInLat,
            check_in_lng=req.checkInLng,
            check_out_time=req.checkOutTime,
            check_out_photo=req.checkOutPhoto,
            check_out_lat=req.checkOutLat,
            check_out_lng=req.checkOutLng,
            status=req.status,
            store_id=req.storeId,
            is_late=req.isLate,
            is_early_leave=req.isEarlyLeave,
            note=req.note,
        )
        db.add(att)
        db.commit()
        return {"success": True, "id": att.id}
