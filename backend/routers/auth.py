"""登录认证 API"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Employee, Company

router = APIRouter()


class LoginRequest(BaseModel):
    empNo: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    user: dict | None = None
    message: str = ""


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(
        Employee.emp_no == req.empNo,
        Employee.is_active == True,
    ).first()
    if not emp:
        return LoginResponse(success=False, message="工号或密码错误")
    if emp.password != req.password:
        return LoginResponse(success=False, message="工号或密码错误")

    company = db.query(Company).filter(Company.id == emp.company_id).first()
    country_id = company.country_id if company else ""

    return LoginResponse(
        success=True,
        user={
            "id": emp.id,
            "empNo": emp.emp_no,
            "name": emp.name,
            "role": emp.role,
            "roleId": emp.role_id,
            "storeId": emp.store_id,
            "regionId": emp.region_id,
            "companyId": emp.company_id,
            "countryId": country_id,
            "assignedRegionIds": emp.assigned_region_ids,
            "assignedStoreIds": emp.assigned_store_ids,
        },
    )
