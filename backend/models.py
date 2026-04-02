"""SQLAlchemy 数据模型"""
from sqlalchemy import String, Text, Boolean, Integer, Float, Column, ForeignKey, JSON
from backend.database import Base


class Country(Base):
    __tablename__ = "countries"
    id = Column(String(50), primary_key=True)
    code = Column(String(10), nullable=False)
    name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(String(20))


class Company(Base):
    __tablename__ = "companies"
    id = Column(String(50), primary_key=True)
    country_id = Column(String(50), ForeignKey("countries.id"))
    company_no = Column(String(50), nullable=False)
    company_name = Column(String(200), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(String(20))
    updated_at = Column(String(20))


class Region(Base):
    __tablename__ = "regions"
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    company_id = Column(String(50), ForeignKey("companies.id"))
    parent_id = Column(String(50), nullable=True)
    created_at = Column(String(20))


class Store(Base):
    __tablename__ = "stores"
    id = Column(String(50), primary_key=True)
    store_no = Column(String(50), nullable=False)
    store_name = Column(String(200), nullable=False)
    address = Column(String(500))
    lat = Column(Float)
    lng = Column(Float)
    status = Column(String(20))
    type = Column(String(50))
    region_id = Column(String(50), ForeignKey("regions.id"))
    company_id = Column(String(50), ForeignKey("companies.id"))
    supervisor_id = Column(String(50))
    manager_id = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(String(20))
    updated_at = Column(String(20))


class Employee(Base):
    __tablename__ = "employees"
    id = Column(String(50), primary_key=True)
    emp_no = Column(String(50), nullable=False)
    name = Column(String(100), nullable=False)
    gender = Column(String(10))
    age = Column(Integer)
    role = Column(String(50))
    role_id = Column(String(50), nullable=True)
    join_date = Column(String(20))
    store_id = Column(String(50), ForeignKey("stores.id"))
    region_id = Column(String(50), ForeignKey("regions.id"))
    company_id = Column(String(50), ForeignKey("companies.id"))
    assigned_region_ids = Column(JSON, nullable=True)
    assigned_store_ids = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    password = Column(String(200))


class ShiftType(Base):
    __tablename__ = "shift_types"
    id = Column(String(50), primary_key=True)
    type_no = Column(String(50))
    type_name = Column(String(100))
    company_id = Column(String(50), ForeignKey("companies.id"))
    updated_by = Column(String(100))
    updated_at = Column(String(30))
    is_active = Column(Boolean, default=True)


class Shift(Base):
    __tablename__ = "shifts"
    id = Column(String(50), primary_key=True)
    shift_no = Column(String(50))
    shift_name = Column(String(200))
    start_time = Column(String(10))
    end_time = Column(String(10))
    type_id = Column(String(50), ForeignKey("shift_types.id"))
    store_id = Column(String(50), ForeignKey("stores.id"))
    created_by = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(String(20))


class Schedule(Base):
    __tablename__ = "schedules"
    id = Column(String(50), primary_key=True)
    emp_id = Column(String(50), ForeignKey("employees.id"))
    shift_id = Column(String(50), ForeignKey("shifts.id"))
    start_date = Column(String(20))
    end_date = Column(String(20))
    store_id = Column(String(50), ForeignKey("stores.id"))
    created_by = Column(String(50))
    created_at = Column(String(20))


class Attendance(Base):
    __tablename__ = "attendances"
    id = Column(String(50), primary_key=True)
    emp_id = Column(String(50), ForeignKey("employees.id"))
    schedule_id = Column(String(50))
    shift_id = Column(String(50), ForeignKey("shifts.id"))
    date = Column(String(20))
    check_in_time = Column(String(10), nullable=True)
    check_in_photo = Column(Text, nullable=True)
    check_in_lat = Column(Float, nullable=True)
    check_in_lng = Column(Float, nullable=True)
    check_out_time = Column(String(10), nullable=True)
    check_out_photo = Column(Text, nullable=True)
    check_out_lat = Column(Float, nullable=True)
    check_out_lng = Column(Float, nullable=True)
    status = Column(String(20))
    store_id = Column(String(50), ForeignKey("stores.id"))
    is_late = Column(Boolean, default=False)
    is_early_leave = Column(Boolean, default=False)
    note = Column(Text, nullable=True)


class Transfer(Base):
    __tablename__ = "transfers"
    id = Column(String(50), primary_key=True)
    emp_id = Column(String(50), ForeignKey("employees.id"))
    from_store_id = Column(String(50), ForeignKey("stores.id"))
    to_store_id = Column(String(50), ForeignKey("stores.id"))
    company_id = Column(String(50), ForeignKey("companies.id"))
    start_date = Column(String(20))
    end_date = Column(String(20))
    status = Column(String(20))
    initiated_by = Column(String(50))
    approved_by = Column(String(50), nullable=True)
    reason = Column(Text, nullable=True)
    reject_reason = Column(Text, nullable=True)
    created_at = Column(String(30))
    updated_at = Column(String(30))


class Handover(Base):
    __tablename__ = "handovers"
    id = Column(String(50), primary_key=True)
    store_id = Column(String(50), ForeignKey("stores.id"))
    company_id = Column(String(50), ForeignKey("companies.id"))
    handover_emp_id = Column(String(50))
    handover_emp_name = Column(String(100))
    handover_role = Column(String(50))
    handover_shift_id = Column(String(50))
    handover_shift_name = Column(String(200))
    receivers = Column(JSON)
    cash_difference = Column(Boolean, default=False)
    cash_diff_amount = Column(Float, nullable=True)
    cash_diff_reason = Column(Text, nullable=True)
    has_inventory = Column(Boolean, default=False)
    inventory_diff = Column(Boolean, default=False)
    inventory_diff_note = Column(Text, nullable=True)
    has_restocked = Column(Boolean, default=False)
    photo_entrance = Column(Text, nullable=True)
    photo_cooked = Column(Text, nullable=True)
    photo_wind_cabinet = Column(Text, nullable=True)
    photo_water_cabinet = Column(Text, nullable=True)
    photo_shelf = Column(Text, nullable=True)
    photo_warehouse = Column(Text, nullable=True)
    photo_handover = Column(Text, nullable=True)
    status = Column(String(20))
    reviewed_by = Column(String(50), nullable=True)
    review_note = Column(Text, nullable=True)
    created_at = Column(String(30))
    updated_at = Column(String(30))


class Role(Base):
    __tablename__ = "roles"
    id = Column(String(50), primary_key=True)
    name = Column(String(100))
    company_id = Column(String(50), ForeignKey("companies.id"))
    data_scope = Column(String(20))
    menu_keys = Column(JSON)
    button_codes = Column(JSON)
    is_active = Column(Boolean, default=True)
    created_at = Column(String(20))
    updated_at = Column(String(20))
