import logging
import time

import alibabacloud_oss_v2 as oss
from fastapi import UploadFile

from app.core.config import settings

logger = logging.getLogger(__name__)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_SIZE = 2 * 1024 * 1024  # 2MB


def _get_client() -> oss.Client:
    credentials = oss.Credentials(
        access_key_id=settings.OSS_ACCESS_KEY_ID,
        access_key_secret=settings.OSS_ACCESS_KEY_SECRET,
    )
    cfg = oss.Config(credentials, endpoint=settings.OSS_ENDPOINT)
    return oss.Client(cfg)


async def upload_avatar(file: UploadFile, resume_id: int) -> str:
    if file.content_type not in ALLOWED_TYPES:
        raise ValueError("仅支持 jpg/png/gif/webp 格式")

    data = await file.read()
    if len(data) > MAX_SIZE:
        raise ValueError("图片大小不能超过 2MB")

    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    key = f"avatars/{resume_id}_{int(time.time())}.{ext}"

    client = _get_client()
    client.put_object(oss.PutObjectRequest(
        bucket=settings.OSS_BUCKET_NAME,
        key=key,
        data=data,
    ))

    url = f"{settings.OSS_PUBLIC_URL}/{key}"
    logger.info("头像已上传: %s", url)
    return url
