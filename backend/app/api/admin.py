from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_admin
from app.core.security import hash_password
from app.models.models import User, Resume, AccessLog, SystemConfig
from app.services import config_service
from app.schemas.schemas import (
    UserOut,
    UserUpdate,
    ResumeOut,
    AccessLogOut,
    SystemConfigUpdate,
)
from app.utils.response import ok, not_found, forbidden

router = APIRouter(prefix="/admin", tags=["后台管理"])


# ── 用户管理 ──────────────────────────────────────

@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(User)
    count_q = select(func.count()).select_from(User)
    if search:
        query = query.where(User.email.contains(search))
        count_q = count_q.where(User.email.contains(search))

    total = (await db.execute(count_q)).scalar() or 0

    offset = (page - 1) * page_size
    result = await db.execute(query.order_by(User.id.desc()).offset(offset).limit(page_size))
    users = result.scalars().all()

    return ok(data={
        "items": [UserOut.model_validate(u).model_dump() for u in users],
        "total": total,
        "page": page,
        "page_size": page_size,
    })


@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    body: UserUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    # 禁止修改自己
    if user_id == admin.id:
        raise forbidden("不能修改自己的信息")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise not_found("用户")

    if body.is_active is not None:
        user.is_active = body.is_active
    if body.is_admin is not None:
        user.is_admin = body.is_admin

    await db.commit()
    await db.refresh(user)
    return ok(data=UserOut.model_validate(user).model_dump())


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    # 禁止删除自己
    if user_id == admin.id:
        raise forbidden("不能删除自己的账号")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise not_found("用户")

    await db.delete(user)
    await db.commit()
    return ok(message="删除成功")


@router.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise not_found("用户")

    user.hashed_password = hash_password(user.email)
    await db.commit()
    return ok(message=f"密码已重置为邮箱地址: {user.email}")


# ── 访问统计 ──────────────────────────────────────

@router.get("/stats")
async def get_stats(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    total_users = (await db.execute(select(func.count()).select_from(User))).scalar() or 0
    total_resumes = (await db.execute(select(func.count()).select_from(Resume))).scalar() or 0

    today = datetime.now(timezone.utc).date()
    today_active = (await db.execute(
        select(func.count(func.distinct(AccessLog.user_id))).where(
            and_(AccessLog.date == today, AccessLog.user_id.isnot(None))
        )
    )).scalar() or 0

    # 最近 7 天每日接口访问次数
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).date()
    endpoint_q = await db.execute(
        select(
            AccessLog.path,
            AccessLog.method,
            AccessLog.date,
            func.sum(AccessLog.count).label("count"),
        )
        .where(AccessLog.date >= seven_days_ago)
        .group_by(AccessLog.path, AccessLog.method, AccessLog.date)
        .order_by(AccessLog.date.desc(), func.sum(AccessLog.count).desc())
    )
    endpoint_stats = [
        {"path": row.path, "method": row.method, "date": str(row.date), "count": row.count}
        for row in endpoint_q.all()
    ]

    return ok(data={
        "total_users": total_users,
        "total_resumes": total_resumes,
        "today_active": today_active,
        "endpoint_stats": endpoint_stats,
    })


# ── 简历管理 ──────────────────────────────────────

@router.get("/resumes")
async def list_all_resumes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: int | None = Query(None),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(Resume)
    count_q = select(func.count()).select_from(Resume)
    if user_id:
        query = query.where(Resume.user_id == user_id)
        count_q = count_q.where(Resume.user_id == user_id)

    total = (await db.execute(count_q)).scalar() or 0
    offset = (page - 1) * page_size
    result = await db.execute(query.order_by(Resume.updated_at.desc()).offset(offset).limit(page_size))
    resumes = result.scalars().all()

    return ok(data={
        "items": [ResumeOut.model_validate(r).model_dump() for r in resumes],
        "total": total,
        "page": page,
        "page_size": page_size,
    })


@router.delete("/resumes/{resume_id}")
async def admin_delete_resume(
    resume_id: int,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Resume).where(Resume.id == resume_id))
    resume = result.scalar_one_or_none()
    if not resume:
        raise not_found("简历")

    await db.delete(resume)
    await db.commit()
    return ok(message="删除成功")


# ── 系统配置 ──────────────────────────────────────

CONFIG_DEFAULTS = {
    "code_expiry_minutes": "5",
    "token_expiry_hours": "24",
    "auto_save_interval_seconds": "30",
    "announcement": "",
}


async def _get_config_dict(db: AsyncSession) -> dict:
    result = await db.execute(select(SystemConfig))
    rows = result.scalars().all()
    cfg = {r.key: r.value for r in rows}
    merged = {}
    for k, default in CONFIG_DEFAULTS.items():
        val = cfg.get(k, default)
        if k != "announcement":
            try:
                merged[k] = int(val)
            except ValueError:
                merged[k] = int(default)
        else:
            merged[k] = val
    return merged


@router.get("/config")
async def get_config(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    cfg = await _get_config_dict(db)
    return ok(data=cfg)


@router.put("/config")
async def update_config(
    body: SystemConfigUpdate,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    updates = body.model_dump(exclude_none=True)
    for key, value in updates.items():
        result = await db.execute(select(SystemConfig).where(SystemConfig.key == key))
        row = result.scalar_one_or_none()
        if row:
            row.value = str(value)
        else:
            db.add(SystemConfig(key=key, value=str(value)))

    await db.commit()
    config_service.invalidate_cache()
    cfg = await _get_config_dict(db)
    return ok(data=cfg)
