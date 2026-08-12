from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from .. import models
from ..activity import log
from ..auth import create_access_token, get_current_user, hash_password, verify_password
from ..db import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterIn(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=128)
    language: str = "he"


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    language: str
    theme: str

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class PrefsIn(BaseModel):
    language: str | None = None
    theme: str | None = None
    name: str | None = None


@router.post("/register", response_model=TokenOut)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == body.email.lower()).first():
        raise HTTPException(400, "Email already registered")
    user = models.User(
        email=body.email.lower(),
        name=body.name.strip(),
        password_hash=hash_password(body.password),
        language=body.language if body.language in {"he", "en"} else "he",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    log(db, user.id, "register", "user", user.id)
    db.commit()
    return TokenOut(access_token=create_access_token(user.id, user.email), user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form.username.lower()).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(400, "Incorrect email or password")
    log(db, user.id, "login", "user", user.id)
    db.commit()
    return TokenOut(access_token=create_access_token(user.id, user.email), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: models.User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserOut)
def update_me(body: PrefsIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    if body.language in {"he", "en"}:
        user.language = body.language
    if body.theme in {"dark", "light"}:
        user.theme = body.theme
    if body.name:
        user.name = body.name.strip()
    db.commit()
    db.refresh(user)
    return user
