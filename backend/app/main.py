from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from .config import settings
from .db import Base, engine, SessionLocal
from .seed import seed_if_empty
from .routers import auth, files, labs, projects, research

limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

app = FastAPI(title="JOKLOB", version="1.0.0")
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
def _rate(_request: Request, _exc: RateLimitExceeded):
    return JSONResponse({"detail": "Too many requests"}, status_code=429)


app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()]
    + ["http://localhost:4173", "http://127.0.0.1:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()


app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(research.router)
app.include_router(labs.router)
app.include_router(files.router)


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "app": "JOKLOB",
        "compute": "sympy+numpy+scipy+mpmath+pint",
        "note": "Language models are not used to produce numerical or symbolic results.",
    }
