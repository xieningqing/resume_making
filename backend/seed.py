"""初始化数据库：创建表、插入模板数据、创建管理员账号。

用法：
    cd backend
    python seed.py
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import engine, Base, async_session
from app.core.security import hash_password
from app.models.models import Template, User, SystemConfig

TEMPLATES = [
    {"name": "默认白", "background_css": "background: #ffffff;", "preview_image": ""},
    {"name": "浅灰", "background_css": "background: #f8f9fa;", "preview_image": ""},
    {"name": "暖白", "background_css": "background: #fefcf3;", "preview_image": ""},
    {"name": "浅蓝", "background_css": "background: #f0f4ff;", "preview_image": ""},
    {"name": "浅紫", "background_css": "background: #f5f0ff;", "preview_image": ""},
    {"name": "渐变蓝紫", "background_css": "background: linear-gradient(135deg, #f0f0ff 0%, #faf5ff 100%);", "preview_image": ""},
]

DEFAULT_CONFIG = [
    {"key": "code_expiry_minutes", "value": "5"},
    {"key": "token_expiry_hours", "value": "24"},
    {"key": "auto_save_interval_seconds", "value": "30"},
    {"key": "announcement", "value": ""},
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # 插入模板
        from sqlalchemy import select
        result = await db.execute(select(Template))
        if not result.scalars().first():
            for t in TEMPLATES:
                db.add(Template(**t))
            print(f"  已插入 {len(TEMPLATES)} 个模板")

        # 创建管理员
        result = await db.execute(select(User).where(User.is_admin == True))
        if not result.scalars().first():
            admin = User(
                email="admin@example.com",
                hashed_password=hash_password("admin123456"),
                is_admin=True,
            )
            db.add(admin)
            print("  已创建管理员: admin@example.com / admin123456")

        # 插入默认配置
        result = await db.execute(select(SystemConfig))
        if not result.scalars().first():
            for c in DEFAULT_CONFIG:
                db.add(SystemConfig(**c))
            print("  已插入默认系统配置")

        await db.commit()

    print("\n数据库初始化完成！")
    print("启动服务: uvicorn main:app --reload --port 8000")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
