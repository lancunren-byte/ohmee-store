"""生产环境配置"""
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    """应用配置"""
    # 服务
    port: int = 8000
    host: str = "0.0.0.0"
    debug: bool = False

    # 数据库（相对项目根目录）
    database_url: str = "sqlite:///./ohmee.db"

    # 安全
    secret_key: str = "ohmee-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7天

    # 打卡
    checkin_max_distance_meters: int = 100
    photo_storage_path: str = "./uploads/photos"

    # 项目根目录
    base_dir: Path = Path(__file__).resolve().parent.parent

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
