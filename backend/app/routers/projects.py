from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .. import models
from ..activity import log
from ..auth import get_current_user
from ..db import get_db

router = APIRouter(prefix="/api/projects", tags=["projects"])


class ProjectIn(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = ""
    domain: str = "general"


class ProjectOut(BaseModel):
    id: int
    title: str
    description: str
    domain: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.get("", response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return (
        db.query(models.Project)
        .filter(models.Project.user_id == user.id)
        .order_by(models.Project.updated_at.desc())
        .all()
    )


@router.post("", response_model=ProjectOut)
def create_project(body: ProjectIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    p = models.Project(user_id=user.id, title=body.title.strip(), description=body.description, domain=body.domain)
    db.add(p)
    db.commit()
    db.refresh(p)
    log(db, user.id, "create", "project", p.id, p.title)
    db.commit()
    return p


@router.get("/{pid}", response_model=ProjectOut)
def get_project(pid: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    p = db.get(models.Project, pid)
    if not p or p.user_id != user.id:
        raise HTTPException(404, "Project not found")
    return p


@router.patch("/{pid}", response_model=ProjectOut)
def update_project(pid: int, body: ProjectIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    p = db.get(models.Project, pid)
    if not p or p.user_id != user.id:
        raise HTTPException(404, "Project not found")
    p.title = body.title.strip()
    p.description = body.description
    p.domain = body.domain
    p.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{pid}")
def delete_project(pid: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    p = db.get(models.Project, pid)
    if not p or p.user_id != user.id:
        raise HTTPException(404, "Project not found")
    db.delete(p)
    log(db, user.id, "delete", "project", pid)
    db.commit()
    return {"ok": True}
