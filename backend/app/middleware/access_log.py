import logging
from datetime import datetime, timezone

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from sqlalchemy import select, update

from app.core.database import async_session
from app.core.security import decode_access_token
from app.models.models import AccessLog

logger = logging.getLogger(__name__)


class AccessLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        if request.method == "OPTIONS":
            return response

        user_id = None
        auth = request.headers.get("authorization", "")
        if auth.startswith("Bearer "):
            user_id = decode_access_token(auth[7:])

        path = str(request.url.path)
        method = request.method
        today = datetime.now(timezone.utc).date()

        try:
            async with async_session() as db:
                result = await db.execute(
                    select(AccessLog).where(
                        AccessLog.path == path,
                        AccessLog.method == method,
                        AccessLog.date == today,
                    )
                )
                existing = result.scalar_one_or_none()

                if existing:
                    await db.execute(
                        update(AccessLog)
                        .where(AccessLog.id == existing.id)
                        .values(count=AccessLog.count + 1)
                    )
                else:
                    log = AccessLog(
                        user_id=user_id,
                        path=path,
                        method=method,
                        ip=request.client.host if request.client else "",
                        user_agent=request.headers.get("user-agent", "")[:500],
                        date=today,
                        count=1,
                    )
                    db.add(log)

                await db.commit()
        except Exception as e:
            logger.warning("访问日志记录失败: %s", e)

        return response
