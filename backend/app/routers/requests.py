from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import asc, case, desc, or_
from sqlalchemy.orm import Session

from app.auth import get_current_admin
from app.database import get_db
from app.models import Request, RequestPriority, RequestStatus, User
from app.schemas import (
    PaginatedRequests,
    RequestCreate,
    RequestOut,
    RequestStatusUpdate,
    SortField,
    SortOrder,
)

router = APIRouter(prefix="/api", tags=["requests"])

PRIORITY_ORDER = case(
    (Request.priority == RequestPriority.high, 3),
    (Request.priority == RequestPriority.normal, 2),
    (Request.priority == RequestPriority.low, 1),
    else_=0,
)


@router.post("/requests", response_model=RequestOut, status_code=status.HTTP_201_CREATED)
def create_request(data: RequestCreate, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    request = Request(
        title=data.title,
        description=data.description,
        priority=data.priority,
        status=RequestStatus.new,
        created_at=now,
        updated_at=now,
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


@router.get("/requests", response_model=PaginatedRequests)
def list_requests(
    db: Session = Depends(get_db),
    status_filter: RequestStatus | None = Query(None, alias="status"),
    priority_filter: RequestPriority | None = Query(None, alias="priority"),
    search: str | None = Query(None, min_length=1),
    sort_by: SortField = Query("created_at"),
    sort_order: SortOrder = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    query = db.query(Request)

    if status_filter is not None:
        query = query.filter(Request.status == status_filter)

    if priority_filter is not None:
        query = query.filter(Request.priority == priority_filter)

    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Request.title.ilike(pattern),
                Request.description.ilike(pattern),
            )
        )

    total = query.count()

    if sort_by == "created_at":
        order_col = Request.created_at
    else:
        order_col = PRIORITY_ORDER

    if sort_order == "asc":
        query = query.order_by(asc(order_col))
    else:
        query = query.order_by(desc(order_col))

    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()

    total_pages = max(1, (total + page_size - 1) // page_size)

    return PaginatedRequests(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.patch("/requests/{request_id}/status", response_model=RequestOut)
def update_request_status(
    request_id: int,
    data: RequestStatusUpdate,
    db: Session = Depends(get_db),
):
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка не найдена",
        )

    if request.status == RequestStatus.done:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Заявку в статусе done нельзя редактировать",
        )

    if data.status == request.status:
        return request

    request.status = data.status
    request.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(request)
    return request


@router.delete("/requests/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_request(
    request_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка не найдена",
        )

    if request.status == RequestStatus.done:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Заявку в статусе done нельзя удалять",
        )

    db.delete(request)
    db.commit()
    return None
