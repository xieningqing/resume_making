import logging
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_verification_email(to_email: str, code: str) -> bool:
    """发送验证码邮件"""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP未配置，跳过邮件发送。验证码: %s -> %s", code, to_email)
        return False

    subject = "【简历制作平台】您的验证码"

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">简历制作平台</h2>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center;">
            <p style="color: #666; margin-bottom: 10px;">您的验证码为：</p>
            <h1 style="color: #4f46e5; font-size: 36px; margin: 10px 0; letter-spacing: 8px;">{code}</h1>
            <p style="color: #999; font-size: 14px;">验证码 {settings.CODE_EXPIRE_MINUTES} 分钟内有效，请勿泄露给他人。</p>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
            如非本人操作，请忽略此邮件。
        </p>
    </div>
    """

    message = MIMEMultipart("alternative")
    message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
    message["To"] = to_email
    message["Subject"] = subject
    message.attach(MIMEText(html_content, "html", "utf-8"))

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=True,
        )
        logger.info("邮件发送成功: %s", to_email)
        return True
    except Exception as e:
        logger.error("邮件发送失败: %s, 错误: %s", to_email, e)
        return False
