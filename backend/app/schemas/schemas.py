from datetime import date, datetime
from pydantic import BaseModel, EmailStr, Field


# ── Auth ──────────────────────────────────────────

class SendCodeRequest(BaseModel):
    email: EmailStr
    purpose: str = Field(pattern="^(register|reset)$")


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=32)
    code: str = Field(min_length=6, max_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── User ──────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    email: str
    nickname: str = ""
    is_active: bool
    is_admin: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    is_active: bool | None = None
    is_admin: bool | None = None


class UpdateNicknameRequest(BaseModel):
    nickname: str = Field(min_length=1, max_length=100)


class ChangePasswordRequest(BaseModel):
    old_password: str | None = None
    new_password: str = Field(min_length=8, max_length=32)
    code: str | None = None


# ── Resume ────────────────────────────────────────

class ResumeCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class ResumeUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    template_id: int | None = None


class ResumeOut(BaseModel):
    id: int
    user_id: int
    title: str
    content: str
    avatar: str = ""
    template_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Template ──────────────────────────────────────

class TemplateOut(BaseModel):
    id: int
    name: str
    background_css: str
    preview_image: str
    is_active: bool

    model_config = {"from_attributes": True}


# ── Pagination ────────────────────────────────────

class PaginatedData(BaseModel):
    items: list
    total: int
    page: int
    page_size: int


# ── Admin Stats ───────────────────────────────────

class AccessLogOut(BaseModel):
    id: int
    user_id: int | None
    path: str
    method: str
    ip: str
    user_agent: str
    date: date
    count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminStatsOut(BaseModel):
    total_users: int
    total_resumes: int
    today_active: int
    recent_access: list[AccessLogOut]


# ── System Config ─────────────────────────────────

class SystemConfigOut(BaseModel):
    code_expiry_minutes: int
    token_expiry_hours: int
    auto_save_interval_seconds: int
    announcement: str


class SystemConfigUpdate(BaseModel):
    code_expiry_minutes: int | None = None
    token_expiry_hours: int | None = None
    auto_save_interval_seconds: int | None = None
    announcement: str | None = None


# ── Response Envelope ─────────────────────────────

class ApiResponse(BaseModel):
    code: int = 0
    message: str = "success"
    data: object | None = None
