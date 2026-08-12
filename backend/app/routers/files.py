import json
import secrets
import uuid
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .. import models
from ..activity import log
from ..auth import get_current_user
from ..config import EXPORT_DIR, UPLOAD_DIR, settings
from ..db import get_db
from ..services.documents import extract_text
from ..services.pdf_export import build_report

router = APIRouter(prefix="/api", tags=["files"])

ALLOWED = {
    ".pdf",
    ".docx",
    ".txt",
    ".csv",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
}


class PdfIn(BaseModel):
    title: str
    question: str = ""
    input_data: str = ""
    variables: list[str] = []
    assumptions: list[str] = []
    formulas: list[str] = []
    steps: list[str] = []
    graphs_note: str = ""
    results: str = ""
    verification: str = ""
    limitations: str = ""
    sources: list[str] = []
    versions: list[str] = []
    certainty_label: str = ""
    language: str = "he"
    project_id: int | None = None
    calculation_id: int | None = None


class DocPatch(BaseModel):
    notes: str | None = None
    project_id: int | None = None


class ShareIn(BaseModel):
    hours: int = 48


class DraftIn(BaseModel):
    key: str
    payload: dict


@router.post("/documents")
async def upload_doc(
    file: UploadFile = File(...),
    project_id: int | None = Form(None),
    notes: str = Form(""),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    name = file.filename or "file"
    suf = Path(name).suffix.lower()
    if suf not in ALLOWED:
        raise HTTPException(400, f"File type {suf} not allowed")
    data = await file.read()
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(400, f"File exceeds {settings.max_upload_mb} MB")
    if project_id:
        p = db.get(models.Project, project_id)
        if not p or p.user_id != user.id:
            raise HTTPException(404, "Project not found")
    stored = f"{uuid.uuid4().hex}{suf}"
    path = UPLOAD_DIR / stored
    path.write_bytes(data)
    text = extract_text(path, file.content_type or "", name)
    doc = models.Document(
        user_id=user.id,
        project_id=project_id,
        filename=stored,
        original_name=name,
        mime=file.content_type or "application/octet-stream",
        size_bytes=len(data),
        extracted_text=text,
        notes=notes,
    )
    db.add(doc)
    db.flush()
    db.add(models.DocumentVersion(document_id=doc.id, version=1, filename=stored, notes="initial upload"))
    log(db, user.id, "upload", "document", doc.id, name)
    db.commit()
    db.refresh(doc)
    return {
        "id": doc.id,
        "original_name": doc.original_name,
        "size_bytes": doc.size_bytes,
        "extracted_text": doc.extracted_text[:8000],
        "project_id": doc.project_id,
        "notes": doc.notes,
    }


@router.get("/documents")
def list_docs(project_id: int | None = None, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    q = db.query(models.Document).filter(models.Document.user_id == user.id)
    if project_id:
        q = q.filter(models.Document.project_id == project_id)
    rows = q.order_by(models.Document.created_at.desc()).all()
    return [
        {
            "id": d.id,
            "original_name": d.original_name,
            "size_bytes": d.size_bytes,
            "project_id": d.project_id,
            "notes": d.notes,
            "created_at": d.created_at.isoformat(),
            "excerpt": (d.extracted_text or "")[:240],
        }
        for d in rows
    ]


@router.get("/documents/{did}")
def get_doc(did: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    d = db.get(models.Document, did)
    if not d or d.user_id != user.id:
        raise HTTPException(404, "Not found")
    return {
        "id": d.id,
        "original_name": d.original_name,
        "mime": d.mime,
        "size_bytes": d.size_bytes,
        "project_id": d.project_id,
        "notes": d.notes,
        "extracted_text": d.extracted_text,
        "versions": [
            {"id": v.id, "version": v.version, "notes": v.notes, "created_at": v.created_at.isoformat()}
            for v in d.versions
        ],
    }


@router.patch("/documents/{did}")
def patch_doc(did: int, body: DocPatch, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    d = db.get(models.Document, did)
    if not d or d.user_id != user.id:
        raise HTTPException(404, "Not found")
    if body.notes is not None:
        d.notes = body.notes
        db.add(models.DocumentVersion(document_id=d.id, version=len(d.versions) + 1, filename=d.filename, notes="notes update"))
    if body.project_id is not None:
        if body.project_id:
            p = db.get(models.Project, body.project_id)
            if not p or p.user_id != user.id:
                raise HTTPException(404, "Project not found")
        d.project_id = body.project_id or None
    db.commit()
    return {"ok": True}


@router.delete("/documents/{did}")
def delete_doc(did: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    d = db.get(models.Document, did)
    if not d or d.user_id != user.id:
        raise HTTPException(404, "Not found")
    path = UPLOAD_DIR / d.filename
    if path.exists():
        path.unlink()
    db.delete(d)
    log(db, user.id, "delete", "document", did)
    db.commit()
    return {"ok": True}


@router.get("/documents/{did}/download")
def download_doc(did: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    d = db.get(models.Document, did)
    if not d or d.user_id != user.id:
        raise HTTPException(404, "Not found")
    path = UPLOAD_DIR / d.filename
    if not path.exists():
        raise HTTPException(404, "File missing")
    return FileResponse(path, filename=d.original_name, media_type=d.mime)


@router.post("/documents/{did}/share")
def share_doc(did: int, body: ShareIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    d = db.get(models.Document, did)
    if not d or d.user_id != user.id:
        raise HTTPException(404, "Not found")
    token = secrets.token_urlsafe(24)
    hours = max(1, min(body.hours, 24 * 14))
    link = models.ShareLink(
        user_id=user.id,
        document_id=d.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=hours),
    )
    db.add(link)
    db.commit()
    return {"token": token, "expires_at": link.expires_at.isoformat(), "path": f"/api/share/{token}"}


@router.get("/share/{token}")
def public_share(token: str, db: Session = Depends(get_db)):
    link = db.query(models.ShareLink).filter(models.ShareLink.token == token).first()
    if not link or link.expires_at < datetime.utcnow():
        raise HTTPException(404, "Link expired or invalid")
    d = db.get(models.Document, link.document_id)
    path = UPLOAD_DIR / d.filename
    if not path.exists():
        raise HTTPException(404, "File missing")
    return FileResponse(path, filename=d.original_name, media_type=d.mime)


@router.post("/pdf")
def make_pdf(body: PdfIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    fname = f"report_{user.id}_{uuid.uuid4().hex[:10]}.pdf"
    path = build_report({**body.model_dump(), "filename": fname})
    rec = models.PdfExport(
        user_id=user.id,
        project_id=body.project_id,
        calculation_id=body.calculation_id,
        title=body.title,
        filename=fname,
    )
    db.add(rec)
    log(db, user.id, "pdf", "export", fname)
    db.commit()
    db.refresh(rec)
    return {"id": rec.id, "filename": fname, "download": f"/api/pdf/{rec.id}/download"}


@router.get("/pdf")
def list_pdf(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    rows = db.query(models.PdfExport).filter(models.PdfExport.user_id == user.id).order_by(models.PdfExport.created_at.desc()).all()
    return [{"id": r.id, "title": r.title, "filename": r.filename, "created_at": r.created_at.isoformat()} for r in rows]


@router.get("/pdf/{pid}/download")
def dl_pdf(pid: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    r = db.get(models.PdfExport, pid)
    if not r or r.user_id != user.id:
        raise HTTPException(404, "Not found")
    path = EXPORT_DIR / r.filename
    if not path.exists():
        raise HTTPException(404, "File missing")
    return FileResponse(path, filename=r.filename, media_type="application/pdf")


@router.get("/search")
def search(q: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    qn = f"%{q.strip()}%"
    if len(q.strip()) < 2:
        return {"projects": [], "problems": [], "documents": []}
    projects = (
        db.query(models.Project)
        .filter(models.Project.user_id == user.id, or_(models.Project.title.ilike(qn), models.Project.description.ilike(qn)))
        .limit(20)
        .all()
    )
    problems = (
        db.query(models.ResearchProblem)
        .filter(
            models.ResearchProblem.user_id == user.id,
            or_(models.ResearchProblem.natural_language.ilike(qn), models.ResearchProblem.formal_statement.ilike(qn)),
        )
        .limit(20)
        .all()
    )
    docs = (
        db.query(models.Document)
        .filter(
            models.Document.user_id == user.id,
            or_(models.Document.original_name.ilike(qn), models.Document.extracted_text.ilike(qn), models.Document.notes.ilike(qn)),
        )
        .limit(20)
        .all()
    )
    return {
        "projects": [{"id": p.id, "title": p.title} for p in projects],
        "problems": [{"id": r.id, "text": r.natural_language[:160], "project_id": r.project_id} for r in problems],
        "documents": [{"id": d.id, "name": d.original_name} for d in docs],
    }


@router.get("/activity")
def activity(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    rows = (
        db.query(models.ActivityLog)
        .filter(models.ActivityLog.user_id == user.id)
        .order_by(models.ActivityLog.created_at.desc())
        .limit(80)
        .all()
    )
    return [
        {"id": a.id, "action": a.action, "entity": a.entity, "entity_id": a.entity_id, "detail": a.detail, "created_at": a.created_at.isoformat()}
        for a in rows
    ]


@router.post("/drafts")
def save_draft(body: DraftIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    row = db.query(models.Draft).filter(models.Draft.user_id == user.id, models.Draft.key == body.key).first()
    payload = json.dumps(body.payload, ensure_ascii=False)
    if row:
        row.payload = payload
        row.updated_at = datetime.utcnow()
    else:
        row = models.Draft(user_id=user.id, key=body.key, payload=payload)
        db.add(row)
    db.commit()
    return {"ok": True}


@router.get("/drafts")
def list_drafts(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    rows = db.query(models.Draft).filter(models.Draft.user_id == user.id).all()
    return [{"key": r.key, "payload": json.loads(r.payload or "{}"), "updated_at": r.updated_at.isoformat()} for r in rows]
