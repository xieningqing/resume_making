from fastapi import HTTPException, status
from app.schemas.schemas import ApiResponse


def ok(data=None, message: str = "success") -> ApiResponse:
    return ApiResponse(code=0, message=message, data=data)


def err(message: str, code: int = 1) -> ApiResponse:
    return ApiResponse(code=code, message=message, data=None)


def not_found(resource: str = "资源") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{resource}不存在",
    )


def bad_request(message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=message,
    )


def forbidden(message: str = "无权执行此操作") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=message,
    )
