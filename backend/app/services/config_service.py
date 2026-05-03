import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.core.database import async_session
from app.models.models import SystemConfig

logger = logging.getLogger(__name__)

CONFIG_DEFAULTS = {
    "code_expiry_minutes": "5",
    "token_expiry_hours": "24",
    "auto_save_interval_seconds": "30",
    "announcement": "",
}


class ConfigService:
    def __init__(self):
        self._cache: dict = {}
        self._cache_time: datetime | None = None
        self._cache_ttl = timedelta(minutes=5)

    async def get(self, key: str) -> str:
        if self._is_cache_valid():
            return self._cache.get(key, CONFIG_DEFAULTS.get(key, ""))

        await self._refresh_cache()
        return self._cache.get(key, CONFIG_DEFAULTS.get(key, ""))

    async def get_int(self, key: str) -> int:
        val = await self.get(key)
        try:
            return int(val)
        except ValueError:
            return int(CONFIG_DEFAULTS.get(key, "0"))

    async def get_code_expiry_minutes(self) -> int:
        return await self.get_int("code_expiry_minutes")

    async def get_token_expiry_hours(self) -> int:
        return await self.get_int("token_expiry_hours")

    async def get_auto_save_interval(self) -> int:
        return await self.get_int("auto_save_interval_seconds")

    async def get_announcement(self) -> str:
        return await self.get("announcement")

    def invalidate_cache(self):
        self._cache.clear()
        self._cache_time = None

    def _is_cache_valid(self) -> bool:
        if not self._cache_time:
            return False
        return datetime.now(timezone.utc) - self._cache_time < self._cache_ttl

    async def _refresh_cache(self):
        try:
            async with async_session() as db:
                result = await db.execute(select(SystemConfig))
                rows = result.scalars().all()
                self._cache = {r.key: r.value for r in rows}
                self._cache_time = datetime.now(timezone.utc)
        except Exception as e:
            logger.error("刷新配置缓存失败: %s", e)


config_service = ConfigService()
