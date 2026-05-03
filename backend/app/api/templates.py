from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Template
from app.schemas.schemas import TemplateOut, ApiResponse

router = APIRouter(prefix="/templates", tags=["模板"])


@router.get("")
async def list_templates(
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Template).where(Template.is_active == True))
    templates = result.scalars().all()
    return ApiResponse(
        code=0,
        message="success",
        data=[TemplateOut.model_validate(t).model_dump() for t in templates],
    )
