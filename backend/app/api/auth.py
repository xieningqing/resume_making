import logging
import random
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import hash_password, verify_password, create_access_token
from app.models.models import User, VerificationCode
from app.schemas.schemas import (
    SendCodeRequest,
    RegisterRequest,
    LoginRequest,
    UserOut,
    UpdateNicknameRequest,
    ChangePasswordRequest,
)
from app.services import config_service
from app.services.email_service import send_verification_email
from app.utils.response import ok, err, bad_request

logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/send-code")
async def send_code(body: SendCodeRequest, db: AsyncSession = Depends(get_db)):
    # 检查 60 秒内是否已发送
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=60)
    result = await db.execute(
        select(VerificationCode).where(
            and_(
                VerificationCode.email == body.email,
                VerificationCode.created_at > cutoff,
            )
        )
    )
    if result.scalar_one_or_none():
        return err("验证码发送过于频繁，请60秒后重试")

    code = f"{random.randint(0, 999999):06d}"
    expiry_minutes = await config_service.get_code_expiry_minutes()
    vc = VerificationCode(
        email=body.email,
        code=code,
        purpose=body.purpose,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=expiry_minutes),
    )
    db.add(vc)
    await db.commit()

    # 发送邮件
    email_sent = await send_verification_email(body.email, code)
    if email_sent:
        logger.info("验证码已发送: email=%s", body.email)
        return ok(message="验证码已发送，请查收邮件")
    else:
        logger.info("验证码已保存(邮件未发送): email=%s, code=%s", body.email, code)
        return ok(message="验证码已发送（邮件服务未配置，验证码已记录到日志）")


@router.post("/register")
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # 检查邮箱是否已注册
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        return err("该邮箱已注册")

    # 验证验证码
    result = await db.execute(
        select(VerificationCode).where(
            and_(
                VerificationCode.email == body.email,
                VerificationCode.code == body.code,
                VerificationCode.purpose == "register",
                VerificationCode.is_used == False,
                VerificationCode.expires_at > datetime.now(timezone.utc),
            )
        )
    )
    vc = result.scalar_one_or_none()
    if not vc:
        return err("验证码无效或已过期")

    # 标记验证码已使用
    vc.is_used = True

    # 创建用户
    user = User(email=body.email, hashed_password=hash_password(body.password))
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id)
    return ok(data={"access_token": token, "token_type": "bearer"})


@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise bad_request("邮箱或密码错误")
    if not user.is_active:
        raise bad_request("账号已被禁用")

    token = create_access_token(user.id)
    return ok(data={"access_token": token, "token_type": "bearer"})


def _user_response(user: User) -> dict:
    nickname = getattr(user, "nickname", "") or ""
    return {
        "id": user.id,
        "email": user.email,
        "nickname": nickname or user.email.split("@")[0],
        "is_active": user.is_active,
        "is_admin": user.is_admin,
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat(),
    }


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return ok(data=_user_response(user))


@router.put("/nickname")
async def update_nickname(
    body: UpdateNicknameRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user.nickname = body.nickname
    await db.commit()
    await db.refresh(user)
    return ok(data=_user_response(user))


@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.code:
        # 忘记密码：验证码验证
        result = await db.execute(
            select(VerificationCode).where(
                and_(
                    VerificationCode.email == user.email,
                    VerificationCode.code == body.code,
                    VerificationCode.purpose == "reset",
                    VerificationCode.is_used == False,
                    VerificationCode.expires_at > datetime.now(timezone.utc),
                )
            )
        )
        vc = result.scalar_one_or_none()
        if not vc:
            return err("验证码无效或已过期")
        vc.is_used = True
    elif body.old_password:
        # 知道旧密码：验证旧密码
        if not verify_password(body.old_password, user.hashed_password):
            return err("旧密码错误")
    else:
        return err("请提供旧密码或验证码")

    # 更新密码
    user.hashed_password = hash_password(body.new_password)
    await db.commit()
    return ok(message="密码修改成功")


@router.get("/announcement")
async def get_announcement():
    text = await config_service.get_announcement()
    return ok(data={"content": text})
