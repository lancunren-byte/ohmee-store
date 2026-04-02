"""初始化数据库并写入演示数据"""
import sys
from pathlib import Path

# 确保项目根目录在 path 中
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import create_engine
from backend.database import Base
from backend.models import (
    Country, Company, Region, Store, Employee,
    ShiftType, Shift, Schedule, Role,
    Transfer, Handover, Attendance,
)
from backend.config import settings


def get_engine():
    url = settings.database_url
    if url.startswith("sqlite"):
        db_path = settings.base_dir / "ohmee.db"
        url = f"sqlite:///{db_path.as_posix()}"
    return create_engine(url, echo=False)


def create_tables(engine):
    Base.metadata.create_all(bind=engine)


def seed_data(engine):
    from sqlalchemy.orm import Session
    db = Session(bind=engine)

    # 检查是否已有数据
    if db.query(Country).first():
        print("数据库已有数据，跳过初始化")
        db.close()
        return

    # 国家
    countries = [
        Country(id="ct1", code="CN", name="中国", is_active=True, created_at="2024-01-01"),
        Country(id="ct2", code="VN", name="越南", is_active=True, created_at="2024-01-01"),
    ]
    db.add_all(countries)

    # 公司
    companies = [
        Company(id="c1", country_id="ct1", company_no="OHMEE-CN", company_name="Ohmee 中国", is_active=True, created_at="2024-01-01", updated_at="2024-01-01"),
        Company(id="c2", country_id="ct2", company_no="OHMEE-VN", company_name="Ohmee 越南", is_active=True, created_at="2024-01-01", updated_at="2024-01-01"),
    ]
    db.add_all(companies)

    # 区域
    regions = [
        Region(id="r1", name="华东区", company_id="c1", created_at="2024-01-01"),
        Region(id="r2", name="华南区", company_id="c1", created_at="2024-01-01"),
        Region(id="r3", name="华北区", company_id="c1", created_at="2024-01-01"),
    ]
    db.add_all(regions)

    # 门店
    stores = [
        Store(id="s1", store_no="SH001", store_name="上海南京路店", address="上海市黄浦区南京东路100号", lat=31.2362, lng=121.4793, status="营业中", type="直营店", region_id="r1", company_id="c1", supervisor_id="e1", manager_id="e3", is_active=True, created_at="2023-03-15", updated_at="2024-01-10"),
        Store(id="s2", store_no="SH002", store_name="上海人民广场店", address="上海市黄浦区人民大道200号", lat=31.2304, lng=121.4737, status="营业中", type="直营店", region_id="r1", company_id="c1", supervisor_id="e1", manager_id="e4", is_active=True, created_at="2023-06-20", updated_at="2024-01-10"),
        Store(id="s3", store_no="GZ001", store_name="广州天河店", address="广州市天河区天河路385号", lat=23.1291, lng=113.2644, status="营业中", type="托管店", region_id="r2", company_id="c1", supervisor_id="e2", manager_id="e5", is_active=True, created_at="2023-09-01", updated_at="2024-01-10"),
        Store(id="s4", store_no="BJ001", store_name="北京王府井店", address="北京市东城区王府井大街88号", lat=39.9154, lng=116.4072, status="建设中", type="特许加盟店", region_id="r3", company_id="c1", supervisor_id="e2", manager_id="", is_active=True, created_at="2024-01-15", updated_at="2024-01-15"),
    ]
    db.add_all(stores)

    # 密码使用 ohmee2026（生产环境应使用 bcrypt 哈希）
    default_pwd = "ohmee2026"  # 产品说明书规定的初始密码

    # 员工
    employees = [
        Employee(id="e1", emp_no="EMP001", name="张伟", gender="男", age=35, role="督导", role_id="role1", join_date="2020-03-01", store_id="s1", region_id="r1", company_id="c1", assigned_region_ids=["r1"], is_active=True, password=default_pwd),
        Employee(id="e2", emp_no="EMP002", name="李娜", gender="女", age=32, role="督导", role_id="role1", join_date="2020-06-15", store_id="s3", region_id="r2", company_id="c1", assigned_region_ids=["r2"], is_active=True, password=default_pwd),
        Employee(id="e3", emp_no="EMP003", name="王强", gender="男", age=28, role="店长", join_date="2021-01-10", store_id="s1", region_id="r1", company_id="c1", is_active=True, password=default_pwd),
        Employee(id="e4", emp_no="EMP004", name="赵敏", gender="女", age=26, role="店长", join_date="2021-05-20", store_id="s2", region_id="r1", company_id="c1", is_active=True, password=default_pwd),
        Employee(id="e5", emp_no="EMP005", name="陈刚", gender="男", age=30, role="店长", join_date="2021-09-01", store_id="s3", region_id="r2", company_id="c1", is_active=True, password=default_pwd),
        Employee(id="e6", emp_no="EMP006", name="刘洋", gender="男", age=23, role="全职店员", join_date="2022-03-15", store_id="s1", region_id="r1", company_id="c1", is_active=True, password=default_pwd),
        Employee(id="e7", emp_no="EMP007", name="周晓", gender="女", age=22, role="全职店员", join_date="2022-07-01", store_id="s1", region_id="r1", company_id="c1", is_active=True, password=default_pwd),
        Employee(id="e8", emp_no="EMP008", name="吴磊", gender="男", age=20, role="兼职店员", join_date="2023-01-10", store_id="s2", region_id="r1", company_id="c1", is_active=True, password=default_pwd),
        Employee(id="e9", emp_no="EMP009", name="孙艳", gender="女", age=24, role="管培生", join_date="2023-06-01", store_id="s1", region_id="r1", company_id="c1", is_active=True, password=default_pwd),
        Employee(id="e10", emp_no="EMP010", name="徐浩", gender="男", age=25, role="稽核专员", role_id="role2", join_date="2022-11-01", store_id="s2", region_id="r1", company_id="c1", is_active=True, password=default_pwd),
    ]
    db.add_all(employees)

    # 角色
    roles = [
        Role(id="role1", name="督导", company_id="c1", data_scope="region", menu_keys=["/pc","/pc/stores","/pc/regions","/pc/employees","/pc/shift-types","/pc/shifts","/pc/schedules","/pc/work-hours","/pc/attendance-export","/pc/handover","/pc/permissions","/pc/tasks","/pc/task-stats","/pc/task-dispatch"], button_codes=["region:add","region:edit","region:delete","store:add","store:edit","store:delete","employee:add","employee:edit","employee:delete","shiftType:add","shiftType:edit","shiftType:delete","handover:view","handover:export","mobile:createShift","mobile:scheduling","mobile:transfer","mobile:approveTransfer","mobile:handover","mobile:approveHandover","mobile:storeSwitch"], is_active=True, created_at="2024-01-01", updated_at="2024-01-01"),
        Role(id="role2", name="稽核专员", company_id="c1", data_scope="company", menu_keys=["/pc","/pc/stores","/pc/regions","/pc/employees","/pc/shift-types","/pc/shifts","/pc/schedules","/pc/work-hours","/pc/attendance-export","/pc/handover","/pc/permissions","/pc/tasks","/pc/task-stats","/pc/task-dispatch","/pc/recruit"], button_codes=["region:add","region:edit","region:delete","store:add","store:edit","store:delete","employee:add","employee:edit","employee:delete","shiftType:add","shiftType:edit","shiftType:delete","handover:view","handover:export"], is_active=True, created_at="2024-01-01", updated_at="2024-01-01"),
        Role(id="role3", name="店长", company_id="c1", data_scope="store", menu_keys=["/pc","/pc/handover"], button_codes=["handover:view","mobile:createShift","mobile:scheduling","mobile:transfer","mobile:approveTransfer","mobile:handover","mobile:approveHandover","mobile:recruit"], is_active=True, created_at="2024-01-01", updated_at="2024-01-01"),
        Role(id="role4", name="全职店员", company_id="c1", data_scope="self", menu_keys=["/pc"], button_codes=[], is_active=True, created_at="2024-01-01", updated_at="2024-01-01"),
        Role(id="role5", name="管培生", company_id="c1", data_scope="self", menu_keys=["/pc"], button_codes=[], is_active=True, created_at="2024-01-01", updated_at="2024-01-01"),
        Role(id="role6", name="兼职店员", company_id="c1", data_scope="self", menu_keys=["/pc"], button_codes=[], is_active=True, created_at="2024-01-01", updated_at="2024-01-01"),
    ]
    db.add_all(roles)

    # 班次类型
    shift_types = [
        ShiftType(id="st1", type_no="ST001", type_name="早班", company_id="c1", updated_by="系统", updated_at="2024-01-01", is_active=True),
        ShiftType(id="st2", type_no="ST002", type_name="中班", company_id="c1", updated_by="系统", updated_at="2024-01-01", is_active=True),
        ShiftType(id="st3", type_no="ST003", type_name="晚班", company_id="c1", updated_by="系统", updated_at="2024-01-01", is_active=True),
        ShiftType(id="st4", type_no="ST004", type_name="大夜班", company_id="c1", updated_by="系统", updated_at="2024-01-01", is_active=True),
    ]
    db.add_all(shift_types)

    # 班次
    shifts = [
        Shift(id="sh1", shift_no="SH001", shift_name="早班 07:00-15:00", start_time="07:00", end_time="15:00", type_id="st1", store_id="s1", created_by="e3", is_active=True, created_at="2024-01-15"),
        Shift(id="sh2", shift_no="SH002", shift_name="中班 15:00-23:00", start_time="15:00", end_time="23:00", type_id="st2", store_id="s1", created_by="e3", is_active=True, created_at="2024-01-15"),
        Shift(id="sh3", shift_no="SH003", shift_name="早班 07:00-15:00", start_time="07:00", end_time="15:00", type_id="st1", store_id="s2", created_by="e4", is_active=True, created_at="2024-01-15"),
    ]
    db.add_all(shifts)

    # 排班
    schedules = [
        Schedule(id="sc1", emp_id="e6", shift_id="sh1", start_date="2026-02-01", end_date="2026-02-28", store_id="s1", created_by="e3", created_at="2026-01-28"),
        Schedule(id="sc2", emp_id="e7", shift_id="sh2", start_date="2026-02-01", end_date="2026-02-28", store_id="s1", created_by="e3", created_at="2026-01-28"),
        Schedule(id="sc3", emp_id="e9", shift_id="sh1", start_date="2026-02-01", end_date="2026-02-28", store_id="s1", created_by="e3", created_at="2026-01-28"),
    ]
    db.add_all(schedules)

    # 交接班
    handovers = [
        Handover(id="hv1", store_id="s1", company_id="c1", handover_emp_id="e6", handover_emp_name="刘洋", handover_role="全职店员", handover_shift_id="sh1", handover_shift_name="早班 07:00-15:00", receivers=[{"empId":"e7","empName":"周晓","role":"全职店员","shiftName":"中班 15:00-23:00"}], cash_difference=False, has_inventory=True, inventory_diff=False, has_restocked=True, status="已确认", reviewed_by="e3", created_at="2026-02-28 15:02:00", updated_at="2026-02-28 15:10:00"),
        Handover(id="hv2", store_id="s1", company_id="c1", handover_emp_id="e7", handover_emp_name="周晓", handover_role="全职店员", handover_shift_id="sh2", handover_shift_name="中班 15:00-23:00", receivers=[{"empId":"e9","empName":"孙艳","role":"管培生","shiftName":"早班 07:00-15:00"}], cash_difference=True, cash_diff_amount=50, cash_diff_reason="收银台找零操作失误", has_inventory=True, inventory_diff=True, inventory_diff_note="矿泉水少4瓶", has_restocked=False, status="待审核", created_at="2026-03-01 23:05:00", updated_at="2026-03-01 23:05:00"),
    ]
    db.add_all(handovers)

    db.commit()
    db.close()
    print("演示数据初始化完成")


def main():
    engine = get_engine()
    create_tables(engine)
    seed_data(engine)
    print("数据库初始化完成")


if __name__ == "__main__":
    main()
