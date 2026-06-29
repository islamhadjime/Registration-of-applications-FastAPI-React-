from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models import RequestPriority, RequestStatus, UserRole


class RequestCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    priority: RequestPriority = RequestPriority.normal


class RequestStatusUpdate(BaseModel):
    status: RequestStatus


class RequestOut(BaseModel):
    id: int
    title: str
    description: str | None
    status: RequestStatus
    priority: RequestPriority
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaginatedRequests(BaseModel):
    items: list[RequestOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=3, max_length=128)


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Имя пользователя может содержать только буквы, цифры, _ и -")
        return cleaned


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: UserRole
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ErrorResponse(BaseModel):
    detail: str


SortField = Literal["created_at", "priority"]
SortOrder = Literal["asc", "desc"]
