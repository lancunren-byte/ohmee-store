"""数据 API - 供前端获取全量数据（与 Zustand 结构兼容）"""
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import (
    Country, Company, Region, Store, Employee,
    ShiftType, Shift, Schedule, Attendance, Transfer, Handover, Role,
)

router = APIRouter()

# ─── Pydantic Request Models ─────────────────────────────────────────────────


class CreateScheduleRequest(BaseModel):
    empId: str
    shiftId: str
    startDate: str
    endDate: str
    storeId: str
    createdBy: str


class CreateRegionRequest(BaseModel):
    name: str
    companyId: str


class UpdateRegionRequest(BaseModel):
    name: Optional[str] = None
    companyId: Optional[str] = None


class CreateStoreRequest(BaseModel):
    storeNo: str
    storeName: str
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    status: Optional[str] = None
    type: Optional[str] = None
    regionId: str
    companyId: str
    supervisorId: Optional[str] = None
    managerId: Optional[str] = None


class UpdateStoreRequest(BaseModel):
    storeNo: Optional[str] = None
    storeName: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    status: Optional[str] = None
    type: Optional[str] = None
    regionId: Optional[str] = None
    supervisorId: Optional[str] = None
    managerId: Optional[str] = None


class CreateEmployeeRequest(BaseModel):
    empNo: str
    name: str
    gender: Optional[str] = None
    age: Optional[int] = None
    role: Optional[str] = None
    roleId: Optional[str] = None
    joinDate: str
    storeId: str
    regionId: str
    companyId: str
    assignedRegionIds: Optional[list] = None
    assignedStoreIds: Optional[list] = None
    password: Optional[str] = None


class UpdateEmployeeRequest(BaseModel):
    empNo: Optional[str] = None
    name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    role: Optional[str] = None
    roleId: Optional[str] = None
    joinDate: Optional[str] = None
    storeId: Optional[str] = None
    regionId: Optional[str] = None
    assignedRegionIds: Optional[list] = None
    assignedStoreIds: Optional[list] = None


class CreateShiftTypeRequest(BaseModel):
    typeNo: Optional[str] = None
    typeName: str
    companyId: str
    updatedBy: Optional[str] = None


class UpdateShiftTypeRequest(BaseModel):
    typeNo: Optional[str] = None
    typeName: Optional[str] = None
    updatedBy: Optional[str] = None


class CreateShiftRequest(BaseModel):
    shiftNo: Optional[str] = None
    shiftName: str
    startTime: str
    endTime: str
    typeId: str
    storeId: str
    createdBy: str


class UpdateShiftRequest(BaseModel):
    shiftNo: Optional[str] = None
    shiftName: Optional[str] = None
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    typeId: Optional[str] = None
    storeId: Optional[str] = None


class CreateTransferRequest(BaseModel):
    empId: str
    fromStoreId: str
    toStoreId: str
    companyId: str
    startDate: str
    endDate: str
    status: str = "待审批"
    initiatedBy: str
    reason: Optional[str] = None


class ApproveTransferRequest(BaseModel):
    approverId: str


class RejectTransferRequest(BaseModel):
    approverId: str
    reason: Optional[str] = None


class CreateHandoverRequest(BaseModel):
    storeId: str
    companyId: str
    handoverEmpId: str
    handoverEmpName: str
    handoverRole: str
    handoverShiftId: Optional[str] = None
    handoverShiftName: Optional[str] = None
    receivers: list
    cashDifference: bool = False
    cashDiffAmount: Optional[float] = None
    cashDiffReason: Optional[str] = None
    hasInventory: bool = False
    inventoryDiff: bool = False
    inventoryDiffNote: Optional[str] = None
    hasRestocked: bool = False
    photoEntrance: Optional[str] = None
    photoCooked: Optional[str] = None
    photoWindCabinet: Optional[str] = None
    photoWaterCabinet: Optional[str] = None
    photoShelf: Optional[str] = None
    photoWarehouse: Optional[str] = None
    photoHandover: Optional[str] = None


class ConfirmHandoverRequest(BaseModel):
    reviewerId: str


class RejectHandoverRequest(BaseModel):
    reviewerId: str
    note: Optional[str] = None


class CreateCountryRequest(BaseModel):
    code: str
    name: str


class UpdateCountryRequest(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None


class CreateCompanyRequest(BaseModel):
    countryId: str
    companyNo: Optional[str] = None
    companyName: str


class UpdateCompanyRequest(BaseModel):
    countryId: Optional[str] = None
    companyNo: Optional[str] = None
    companyName: Optional[str] = None


class CreateRoleRequest(BaseModel):
    name: str
    companyId: str
    dataScope: str
    menuKeys: Optional[list] = None
    buttonCodes: Optional[list] = None


class UpdateRoleRequest(BaseModel):
    name: Optional[str] = None
    dataScope: Optional[str] = None
    menuKeys: Optional[list] = None
    buttonCodes: Optional[list] = None


def _to_dict(obj, exclude=None):
    if obj is None:
        return None
    d = {}
    for c in obj.__table__.columns:
        if exclude and c.name in exclude:
            continue
        v = getattr(obj, c.name)
        if hasattr(v, "isoformat"):
            v = v.isoformat() if v else None
        d[c.name] = v
    return d


def _map_key(d, key_map):
    """将 snake_case 转为 camelCase"""
    out = {}
    for k, v in d.items():
        new_k = key_map.get(k, "".join(w if i == 0 else w.capitalize() for i, w in enumerate(k.split("_"))))
        out[new_k] = v
    return out


def snake_to_camel(name):
    parts = name.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def _camel_to_snake(name: str) -> str:
    import re
    return re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()


def model_to_json(obj):
    if obj is None:
        return None
    d = {}
    for c in obj.__table__.columns:
        v = getattr(obj, c.name)
        if hasattr(v, "isoformat"):
            v = v.isoformat() if v else None
        d[snake_to_camel(c.name)] = v
    return d


@router.get("/data")
def get_all_data(db: Session = Depends(get_db)):
    """获取全量数据，供前端 Zustand 水合"""
    countries = [model_to_json(c) for c in db.query(Country).filter(Country.is_active == True).all()]
    companies = [model_to_json(c) for c in db.query(Company).filter(Company.is_active == True).all()]
    regions = [model_to_json(r) for r in db.query(Region).all()]
    stores = [model_to_json(s) for s in db.query(Store).filter(Store.is_active == True).all()]
    employees = [model_to_json(e) for e in db.query(Employee).filter(Employee.is_active == True).all()]
    shift_types = [model_to_json(s) for s in db.query(ShiftType).filter(ShiftType.is_active == True).all()]
    shifts = [model_to_json(s) for s in db.query(Shift).all()]
    schedules = [model_to_json(s) for s in db.query(Schedule).all()]
    attendances = [model_to_json(a) for a in db.query(Attendance).all()]
    transfers = [model_to_json(t) for t in db.query(Transfer).all()]
    handovers = [model_to_json(h) for h in db.query(Handover).all()]
    roles = [model_to_json(r) for r in db.query(Role).filter(Role.is_active == True).all()]

    # 字段名映射：前端使用 password 等
    for e in employees:
        e["password"] = "***"  # 不返回真实密码

    return {
        "countries": countries,
        "companies": companies,
        "regions": regions,
        "stores": stores,
        "employees": employees,
        "shiftTypes": shift_types,
        "shifts": shifts,
        "schedules": schedules,
        "attendances": attendances,
        "transfers": transfers,
        "handovers": handovers,
        "roles": roles,
    }


@router.post("/schedules")
def create_schedule(req: CreateScheduleRequest, db: Session = Depends(get_db)):
    """新增排班"""
    emp = db.query(Employee).filter(Employee.id == req.empId, Employee.is_active == True).first()
    if not emp:
        raise HTTPException(400, "员工不存在或已停用")
    shift = db.query(Shift).filter(Shift.id == req.shiftId).first()
    if not shift:
        raise HTTPException(400, "班次不存在")
    store = db.query(Store).filter(Store.id == req.storeId, Store.is_active == True).first()
    if not store:
        raise HTTPException(400, "门店不存在或已停用")

    now = datetime.now().strftime("%Y-%m-%d")
    sched = Schedule(
        id=str(uuid.uuid4()),
        emp_id=req.empId,
        shift_id=req.shiftId,
        start_date=req.startDate,
        end_date=req.endDate,
        store_id=req.storeId,
        created_by=req.createdBy,
        created_at=now,
    )
    db.add(sched)
    db.commit()
    db.refresh(sched)
    return model_to_json(sched)


@router.delete("/schedules/{schedule_id}")
def delete_schedule(schedule_id: str, db: Session = Depends(get_db)):
    """删除排班"""
    sched = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not sched:
        raise HTTPException(404, "排班不存在")
    db.delete(sched)
    db.commit()
    return {"success": True}


# ─── Region CRUD ─────────────────────────────────────────────────────────────


@router.post("/regions")
def create_region(req: CreateRegionRequest, db: Session = Depends(get_db)):
    now = datetime.now().strftime("%Y-%m-%d")
    r = Region(id=str(uuid.uuid4()), name=req.name, company_id=req.companyId, created_at=now)
    db.add(r)
    db.commit()
    db.refresh(r)
    return model_to_json(r)


@router.put("/regions/{region_id}")
def update_region(region_id: str, req: UpdateRegionRequest, db: Session = Depends(get_db)):
    r = db.query(Region).filter(Region.id == region_id).first()
    if not r:
        raise HTTPException(404, "区域不存在")
    if req.name is not None:
        r.name = req.name
    if req.companyId is not None:
        r.company_id = req.companyId
    db.commit()
    db.refresh(r)
    return model_to_json(r)


@router.delete("/regions/{region_id}")
def delete_region(region_id: str, db: Session = Depends(get_db)):
    r = db.query(Region).filter(Region.id == region_id).first()
    if not r:
        raise HTTPException(404, "区域不存在")
    db.delete(r)
    db.commit()
    return {"success": True}


# ─── Store CRUD ─────────────────────────────────────────────────────────────


@router.post("/stores")
def create_store(req: CreateStoreRequest, db: Session = Depends(get_db)):
    now = datetime.now().strftime("%Y-%m-%d")
    s = Store(
        id=str(uuid.uuid4()),
        store_no=req.storeNo,
        store_name=req.storeName,
        address=req.address or "",
        lat=req.lat or 0,
        lng=req.lng or 0,
        status=req.status or "营业中",
        type=req.type or "直营店",
        region_id=req.regionId,
        company_id=req.companyId,
        supervisor_id=req.supervisorId or "",
        manager_id=req.managerId or "",
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return model_to_json(s)


@router.put("/stores/{store_id}")
def update_store(store_id: str, req: UpdateStoreRequest, db: Session = Depends(get_db)):
    s = db.query(Store).filter(Store.id == store_id).first()
    if not s:
        raise HTTPException(404, "门店不存在")
    mapping = {"storeNo": "store_no", "storeName": "store_name", "regionId": "region_id", "supervisorId": "supervisor_id", "managerId": "manager_id"}
    for k, v in req.model_dump(exclude_unset=True).items():
        if v is not None:
            attr = mapping.get(k, _camel_to_snake(k))
            if hasattr(s, attr):
                setattr(s, attr, v)
    s.updated_at = datetime.now().strftime("%Y-%m-%d")
    db.commit()
    db.refresh(s)
    return model_to_json(s)


@router.patch("/stores/{store_id}/deactivate")
def deactivate_store(store_id: str, db: Session = Depends(get_db)):
    s = db.query(Store).filter(Store.id == store_id).first()
    if not s:
        raise HTTPException(404, "门店不存在")
    s.is_active = False
    s.status = "已闭店"
    s.updated_at = datetime.now().strftime("%Y-%m-%d")
    db.commit()
    db.refresh(s)
    return model_to_json(s)


# ─── Employee CRUD ──────────────────────────────────────────────────────────


@router.post("/employees")
def create_employee(req: CreateEmployeeRequest, db: Session = Depends(get_db)):
    pwd = req.password or "ohmee2026"
    e = Employee(
        id=str(uuid.uuid4()),
        emp_no=req.empNo,
        name=req.name,
        gender=req.gender or "",
        age=req.age or 0,
        role=req.role or "全职店员",
        role_id=req.roleId,
        join_date=req.joinDate,
        store_id=req.storeId,
        region_id=req.regionId,
        company_id=req.companyId,
        assigned_region_ids=req.assignedRegionIds,
        assigned_store_ids=req.assignedStoreIds,
        is_active=True,
        password=pwd,
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    out = model_to_json(e)
    out["password"] = "***"
    return out


_emp_attr_map = {"empNo": "emp_no", "storeId": "store_id", "regionId": "region_id", "assignedRegionIds": "assigned_region_ids", "assignedStoreIds": "assigned_store_ids"}


@router.put("/employees/{emp_id}")
def update_employee(emp_id: str, req: UpdateEmployeeRequest, db: Session = Depends(get_db)):
    e = db.query(Employee).filter(Employee.id == emp_id).first()
    if not e:
        raise HTTPException(404, "员工不存在")
    for k, v in req.model_dump(exclude_unset=True).items():
        if v is not None:
            attr = _emp_attr_map.get(k, _camel_to_snake(k))
            if hasattr(e, attr):
                setattr(e, attr, v)
    db.commit()
    db.refresh(e)
    out = model_to_json(e)
    out["password"] = "***"
    return out


@router.patch("/employees/{emp_id}/deactivate")
def deactivate_employee(emp_id: str, db: Session = Depends(get_db)):
    e = db.query(Employee).filter(Employee.id == emp_id).first()
    if not e:
        raise HTTPException(404, "员工不存在")
    e.is_active = False
    db.commit()
    db.refresh(e)
    out = model_to_json(e)
    out["password"] = "***"
    return out


# ─── ShiftType CRUD ─────────────────────────────────────────────────────────


@router.post("/shift-types")
def create_shift_type(req: CreateShiftTypeRequest, db: Session = Depends(get_db)):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    st = ShiftType(
        id=str(uuid.uuid4()),
        type_no=req.typeNo or req.typeName[:2] + "001",
        type_name=req.typeName,
        company_id=req.companyId,
        updated_by=req.updatedBy or "系统",
        updated_at=now,
        is_active=True,
    )
    db.add(st)
    db.commit()
    db.refresh(st)
    return model_to_json(st)


@router.put("/shift-types/{type_id}")
def update_shift_type(type_id: str, req: UpdateShiftTypeRequest, db: Session = Depends(get_db)):
    st = db.query(ShiftType).filter(ShiftType.id == type_id).first()
    if not st:
        raise HTTPException(404, "班次类型不存在")
    if req.typeNo is not None:
        st.type_no = req.typeNo
    if req.typeName is not None:
        st.type_name = req.typeName
    if req.updatedBy is not None:
        st.updated_by = req.updatedBy
    st.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.commit()
    db.refresh(st)
    return model_to_json(st)


@router.patch("/shift-types/{type_id}/deactivate")
def deactivate_shift_type(type_id: str, db: Session = Depends(get_db)):
    st = db.query(ShiftType).filter(ShiftType.id == type_id).first()
    if not st:
        raise HTTPException(404, "班次类型不存在")
    st.is_active = False
    st.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.commit()
    db.refresh(st)
    return model_to_json(st)


# ─── Shift CRUD ─────────────────────────────────────────────────────────────


@router.post("/shifts")
def create_shift(req: CreateShiftRequest, db: Session = Depends(get_db)):
    now = datetime.now().strftime("%Y-%m-%d")
    sh = Shift(
        id=str(uuid.uuid4()),
        shift_no=req.shiftNo or "SH001",
        shift_name=req.shiftName,
        start_time=req.startTime,
        end_time=req.endTime,
        type_id=req.typeId,
        store_id=req.storeId,
        created_by=req.createdBy,
        is_active=True,
        created_at=now,
    )
    db.add(sh)
    db.commit()
    db.refresh(sh)
    return model_to_json(sh)


_shift_attr_map = {"shiftNo": "shift_no", "shiftName": "shift_name", "startTime": "start_time", "endTime": "end_time", "typeId": "type_id", "storeId": "store_id"}


@router.put("/shifts/{shift_id}")
def update_shift(shift_id: str, req: UpdateShiftRequest, db: Session = Depends(get_db)):
    sh = db.query(Shift).filter(Shift.id == shift_id).first()
    if not sh:
        raise HTTPException(404, "班次不存在")
    for k, v in req.model_dump(exclude_unset=True).items():
        if v is not None:
            attr = _shift_attr_map.get(k, _camel_to_snake(k))
            if hasattr(sh, attr):
                setattr(sh, attr, v)
    db.commit()
    db.refresh(sh)
    return model_to_json(sh)


@router.patch("/shifts/{shift_id}/deactivate")
def deactivate_shift(shift_id: str, db: Session = Depends(get_db)):
    sh = db.query(Shift).filter(Shift.id == shift_id).first()
    if not sh:
        raise HTTPException(404, "班次不存在")
    sh.is_active = False
    db.commit()
    db.refresh(sh)
    return model_to_json(sh)


# ─── Transfer CRUD ──────────────────────────────────────────────────────────


@router.post("/transfers")
def create_transfer(req: CreateTransferRequest, db: Session = Depends(get_db)):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    t = Transfer(
        id=str(uuid.uuid4()),
        emp_id=req.empId,
        from_store_id=req.fromStoreId,
        to_store_id=req.toStoreId,
        company_id=req.companyId,
        start_date=req.startDate,
        end_date=req.endDate,
        status=req.status,
        initiated_by=req.initiatedBy,
        reason=req.reason,
        created_at=now,
        updated_at=now,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return model_to_json(t)


@router.patch("/transfers/{transfer_id}/approve")
def approve_transfer(transfer_id: str, req: ApproveTransferRequest, db: Session = Depends(get_db)):
    t = db.query(Transfer).filter(Transfer.id == transfer_id).first()
    if not t:
        raise HTTPException(404, "借调记录不存在")
    t.status = "已批准"
    t.approved_by = req.approverId
    t.reject_reason = None
    t.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.commit()
    db.refresh(t)
    return model_to_json(t)


@router.patch("/transfers/{transfer_id}/reject")
def reject_transfer(transfer_id: str, req: RejectTransferRequest, db: Session = Depends(get_db)):
    t = db.query(Transfer).filter(Transfer.id == transfer_id).first()
    if not t:
        raise HTTPException(404, "借调记录不存在")
    t.status = "已拒绝"
    t.approved_by = req.approverId
    t.reject_reason = req.reason or ""
    t.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.commit()
    db.refresh(t)
    return model_to_json(t)


# ─── Handover CRUD ──────────────────────────────────────────────────────────


@router.post("/handovers")
def create_handover(req: CreateHandoverRequest, db: Session = Depends(get_db)):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    h = Handover(
        id=str(uuid.uuid4()),
        store_id=req.storeId,
        company_id=req.companyId,
        handover_emp_id=req.handoverEmpId,
        handover_emp_name=req.handoverEmpName,
        handover_role=req.handoverRole,
        handover_shift_id=req.handoverShiftId or "",
        handover_shift_name=req.handoverShiftName or "",
        receivers=req.receivers,
        cash_difference=req.cashDifference,
        cash_diff_amount=req.cashDiffAmount,
        cash_diff_reason=req.cashDiffReason,
        has_inventory=req.hasInventory,
        inventory_diff=req.inventoryDiff,
        inventory_diff_note=req.inventoryDiffNote,
        has_restocked=req.hasRestocked,
        photo_entrance=req.photoEntrance,
        photo_cooked=req.photoCooked,
        photo_wind_cabinet=req.photoWindCabinet,
        photo_water_cabinet=req.photoWaterCabinet,
        photo_shelf=req.photoShelf,
        photo_warehouse=req.photoWarehouse,
        photo_handover=req.photoHandover,
        status="待审核",
        created_at=now,
        updated_at=now,
    )
    db.add(h)
    db.commit()
    db.refresh(h)
    return model_to_json(h)


@router.patch("/handovers/{handover_id}/confirm")
def confirm_handover(handover_id: str, req: ConfirmHandoverRequest, db: Session = Depends(get_db)):
    h = db.query(Handover).filter(Handover.id == handover_id).first()
    if not h:
        raise HTTPException(404, "交接班记录不存在")
    h.status = "已确认"
    h.reviewed_by = req.reviewerId
    h.review_note = None
    h.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.commit()
    db.refresh(h)
    return model_to_json(h)


@router.patch("/handovers/{handover_id}/reject")
def reject_handover(handover_id: str, req: RejectHandoverRequest, db: Session = Depends(get_db)):
    h = db.query(Handover).filter(Handover.id == handover_id).first()
    if not h:
        raise HTTPException(404, "交接班记录不存在")
    h.status = "已驳回"
    h.reviewed_by = req.reviewerId
    h.review_note = req.note or ""
    h.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.commit()
    db.refresh(h)
    return model_to_json(h)


# ─── Country CRUD ───────────────────────────────────────────────────────────


@router.post("/countries")
def create_country(req: CreateCountryRequest, db: Session = Depends(get_db)):
    now = datetime.now().strftime("%Y-%m-%d")
    c = Country(id=str(uuid.uuid4()), code=req.code, name=req.name, is_active=True, created_at=now)
    db.add(c)
    db.commit()
    db.refresh(c)
    return model_to_json(c)


@router.put("/countries/{country_id}")
def update_country(country_id: str, req: UpdateCountryRequest, db: Session = Depends(get_db)):
    c = db.query(Country).filter(Country.id == country_id).first()
    if not c:
        raise HTTPException(404, "国家不存在")
    if req.code is not None:
        c.code = req.code
    if req.name is not None:
        c.name = req.name
    db.commit()
    db.refresh(c)
    return model_to_json(c)


@router.patch("/countries/{country_id}/deactivate")
def deactivate_country(country_id: str, db: Session = Depends(get_db)):
    c = db.query(Country).filter(Country.id == country_id).first()
    if not c:
        raise HTTPException(404, "国家不存在")
    c.is_active = False
    db.commit()
    db.refresh(c)
    return model_to_json(c)


# ─── Company CRUD ─────────────────────────────────────────────────────────────


@router.post("/companies")
def create_company(req: CreateCompanyRequest, db: Session = Depends(get_db)):
    now = datetime.now().strftime("%Y-%m-%d")
    c = Company(
        id=str(uuid.uuid4()),
        country_id=req.countryId,
        company_no=req.companyNo or f"C{now[:4]}",
        company_name=req.companyName,
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return model_to_json(c)


@router.put("/companies/{company_id}")
def update_company(company_id: str, req: UpdateCompanyRequest, db: Session = Depends(get_db)):
    c = db.query(Company).filter(Company.id == company_id).first()
    if not c:
        raise HTTPException(404, "公司不存在")
    if req.countryId is not None:
        c.country_id = req.countryId
    if req.companyNo is not None:
        c.company_no = req.companyNo
    if req.companyName is not None:
        c.company_name = req.companyName
    c.updated_at = datetime.now().strftime("%Y-%m-%d")
    db.commit()
    db.refresh(c)
    return model_to_json(c)


@router.patch("/companies/{company_id}/deactivate")
def deactivate_company(company_id: str, db: Session = Depends(get_db)):
    c = db.query(Company).filter(Company.id == company_id).first()
    if not c:
        raise HTTPException(404, "公司不存在")
    c.is_active = False
    c.updated_at = datetime.now().strftime("%Y-%m-%d")
    db.commit()
    db.refresh(c)
    return model_to_json(c)


# ─── Role CRUD ───────────────────────────────────────────────────────────────


@router.post("/roles")
def create_role(req: CreateRoleRequest, db: Session = Depends(get_db)):
    now = datetime.now().strftime("%Y-%m-%d")
    r = Role(
        id=str(uuid.uuid4()),
        name=req.name,
        company_id=req.companyId,
        data_scope=req.dataScope,
        menu_keys=req.menuKeys or [],
        button_codes=req.buttonCodes or [],
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return model_to_json(r)


@router.put("/roles/{role_id}")
def update_role(role_id: str, req: UpdateRoleRequest, db: Session = Depends(get_db)):
    r = db.query(Role).filter(Role.id == role_id).first()
    if not r:
        raise HTTPException(404, "角色不存在")
    if req.name is not None:
        r.name = req.name
    if req.dataScope is not None:
        r.data_scope = req.dataScope
    if req.menuKeys is not None:
        r.menu_keys = req.menuKeys
    if req.buttonCodes is not None:
        r.button_codes = req.buttonCodes
    r.updated_at = datetime.now().strftime("%Y-%m-%d")
    db.commit()
    db.refresh(r)
    return model_to_json(r)


@router.patch("/roles/{role_id}/deactivate")
def deactivate_role(role_id: str, db: Session = Depends(get_db)):
    r = db.query(Role).filter(Role.id == role_id).first()
    if not r:
        raise HTTPException(404, "角色不存在")
    r.is_active = False
    r.updated_at = datetime.now().strftime("%Y-%m-%d")
    db.commit()
    db.refresh(r)
    return model_to_json(r)
