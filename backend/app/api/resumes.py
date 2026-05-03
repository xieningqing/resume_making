import logging

from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Resume
from app.schemas.schemas import ResumeCreate, ResumeUpdate, ResumeOut
from app.services import oss_service
from app.utils.response import ok, err, not_found, bad_request

router = APIRouter(prefix="/resumes", tags=["简历"])
logger = logging.getLogger(__name__)


@router.get("")
async def list_resumes(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * page_size

    count_result = await db.execute(
        select(func.count()).select_from(Resume).where(Resume.user_id == user.id)
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        select(Resume)
        .where(Resume.user_id == user.id)
        .order_by(Resume.updated_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    resumes = result.scalars().all()

    return ok(data={
        "items": [ResumeOut.model_validate(r).model_dump() for r in resumes],
        "total": total,
        "page": page,
        "page_size": page_size,
    })


@router.post("")
async def create_resume(
    body: ResumeCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    title = body.title
    exists = await db.execute(
        select(Resume).where(Resume.user_id == user.id, Resume.title == title)
    )
    if exists.scalar_one_or_none():
        suffix = "-副本"
        candidate = f"{title}{suffix}"
        n = 2
        while True:
            dup = await db.execute(
                select(Resume).where(Resume.user_id == user.id, Resume.title == candidate)
            )
            if not dup.scalar_one_or_none():
                break
            candidate = f"{title}{suffix}{n}"
            n += 1
        title = candidate

    resume = Resume(user_id=user.id, title=title, content="", template_id=1)
    db.add(resume)
    await db.commit()
    await db.refresh(resume)
    return ok(data=ResumeOut.model_validate(resume).model_dump())


@router.get("/{resume_id}")
async def get_resume(
    resume_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise not_found("简历")
    return ok(data=ResumeOut.model_validate(resume).model_dump())


@router.put("/{resume_id}")
async def update_resume(
    resume_id: int,
    body: ResumeUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise not_found("简历")

    if body.title is not None and body.title != resume.title:
        exists = await db.execute(
            select(Resume).where(Resume.user_id == user.id, Resume.title == body.title)
        )
        if exists.scalar_one_or_none():
            raise bad_request("已存在同名简历，请使用其他标题")
        resume.title = body.title
    if body.content is not None:
        resume.content = body.content
    if body.template_id is not None:
        resume.template_id = body.template_id

    try:
        await db.commit()
        await db.refresh(resume)
    except Exception as e:
        logger.exception("保存简历失败: resume_id=%d, content_len=%d", resume_id, len(body.content or ""))
        raise bad_request(f"保存失败: {e}")

    return ok(data=ResumeOut.model_validate(resume).model_dump())


@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise not_found("简历")

    await db.delete(resume)
    await db.commit()
    return ok(message="删除成功")


@router.post("/{resume_id}/avatar")
async def upload_resume_avatar(
    resume_id: int,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise not_found("简历")

    try:
        url = await oss_service.upload_avatar(file, resume_id)
    except ValueError as e:
        return err(str(e))

    resume.avatar = url
    await db.commit()
    await db.refresh(resume)
    return ok(data=ResumeOut.model_validate(resume).model_dump())


@router.delete("/{resume_id}/avatar")
async def delete_resume_avatar(
    resume_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise not_found("简历")

    resume.avatar = ""
    await db.commit()
    return ok(message="头像已删除")
