"""APP 版本管理接口"""
import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

VERSION_FILE = Path(__file__).resolve().parent.parent.parent / "app-version.json"

DEFAULT_VERSION = {
    "version": "1.0.0",
    "build": 1,
    "force_update": False,
    "apk_url": "https://ohmeesm.com/apk/ohmee-latest.apk",
    "release_notes": "初始版本",
}


class VersionUpdate(BaseModel):
    version: str
    build: int
    force_update: bool = True
    apk_url: str = "https://ohmeesm.com/apk/ohmee-latest.apk"
    release_notes: str = ""


@router.get("/app-version")
def get_app_version():
    if VERSION_FILE.exists():
        with open(VERSION_FILE, encoding="utf-8") as f:
            return json.load(f)
    # 首次访问时创建默认版本文件
    with open(VERSION_FILE, "w", encoding="utf-8") as f:
        json.dump(DEFAULT_VERSION, f, ensure_ascii=False, indent=2)
    return DEFAULT_VERSION


@router.put("/app-version")
def update_app_version(data: VersionUpdate):
    """更新版本信息（管理员调用）"""
    version_data = data.model_dump()
    with open(VERSION_FILE, "w", encoding="utf-8") as f:
        json.dump(version_data, f, ensure_ascii=False, indent=2)
    return {"success": True, "data": version_data}
