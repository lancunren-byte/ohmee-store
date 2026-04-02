"""Ohmee 巡店系统 - FastAPI 生产服务"""
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.config import settings
from backend.routers import auth, data, attendance

app = FastAPI(title="Ohmee 巡店系统 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 路由
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(data.router, prefix="/api", tags=["数据"])
app.include_router(attendance.router, prefix="/api", tags=["打卡"])


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


# 生产环境：托管前端静态文件
dist_path = settings.base_dir / "dist"
if dist_path.exists():
    app.mount("/assets", StaticFiles(directory=dist_path / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        """SPA 路由回退：未匹配的路径返回 index.html"""
        if full_path.startswith("api"):
            from fastapi import HTTPException
            raise HTTPException(404, "Not Found")
        file_path = dist_path / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(dist_path / "index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
