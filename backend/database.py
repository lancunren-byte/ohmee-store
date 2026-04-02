"""数据库连接与会话"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.orm import DeclarativeBase
from backend.config import settings

# 同步 SQLite，便于部署与初始化
_db_url = settings.database_url.replace("sqlite+aiosqlite", "sqlite")
engine = create_engine(_db_url, echo=settings.debug)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
