from datetime import datetime
from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def utcnow() -> datetime:
    return datetime.utcnow()


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(String(255))
    language: Mapped[str] = mapped_column(String(8), default="he")
    theme: Mapped[str] = mapped_column(String(16), default="dark")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    domain: Mapped[str] = mapped_column(String(64), default="general")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    owner = relationship("User", back_populates="projects")
    problems = relationship("ResearchProblem", back_populates="project", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    simulations = relationship("Simulation", back_populates="project", cascade="all, delete-orphan")


class ResearchProblem(Base):
    __tablename__ = "research_problems"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    natural_language: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(8), default="he")
    domain: Mapped[str] = mapped_column(String(64), default="unknown")
    formal_statement: Mapped[str] = mapped_column(Text, default="")
    missing_data: Mapped[str] = mapped_column(Text, default="[]")
    status: Mapped[str] = mapped_column(String(32), default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    project = relationship("Project", back_populates="problems")
    variables = relationship("ProblemVariable", back_populates="problem", cascade="all, delete-orphan")
    assumptions = relationship("Assumption", back_populates="problem", cascade="all, delete-orphan")
    calculations = relationship("Calculation", back_populates="problem", cascade="all, delete-orphan")


class ProblemVariable(Base):
    __tablename__ = "problem_variables"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    problem_id: Mapped[int] = mapped_column(ForeignKey("research_problems.id"), index=True)
    name: Mapped[str] = mapped_column(String(64))
    symbol: Mapped[str] = mapped_column(String(32), default="")
    value: Mapped[str] = mapped_column(String(255), default="")
    unit: Mapped[str] = mapped_column(String(64), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    confirmed: Mapped[bool] = mapped_column(Boolean, default=False)

    problem = relationship("ResearchProblem", back_populates="variables")


class Assumption(Base):
    __tablename__ = "assumptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    problem_id: Mapped[int] = mapped_column(ForeignKey("research_problems.id"), index=True)
    text: Mapped[str] = mapped_column(Text)
    kind: Mapped[str] = mapped_column(String(32), default="modeling")
    confirmed: Mapped[bool] = mapped_column(Boolean, default=False)

    problem = relationship("ResearchProblem", back_populates="assumptions")


class Calculation(Base):
    __tablename__ = "calculations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    problem_id: Mapped[int] = mapped_column(ForeignKey("research_problems.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    engine: Mapped[str] = mapped_column(String(64), default="sympy")
    input_payload: Mapped[str] = mapped_column(Text, default="{}")
    output_payload: Mapped[str] = mapped_column(Text, default="{}")
    certainty: Mapped[str] = mapped_column(String(32), default="partial")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    problem = relationship("ResearchProblem", back_populates="calculations")
    steps = relationship("SolutionStep", back_populates="calculation", cascade="all, delete-orphan")
    result = relationship("Result", back_populates="calculation", uselist=False, cascade="all, delete-orphan")


class SolutionStep(Base):
    __tablename__ = "solution_steps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    calculation_id: Mapped[int] = mapped_column(ForeignKey("calculations.id"), index=True)
    ord: Mapped[int] = mapped_column(Integer, default=1)
    title: Mapped[str] = mapped_column(String(255), default="")
    explanation: Mapped[str] = mapped_column(Text, default="")
    latex: Mapped[str] = mapped_column(Text, default="")
    method: Mapped[str] = mapped_column(String(64), default="")

    calculation = relationship("Calculation", back_populates="steps")


class Result(Base):
    __tablename__ = "results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    calculation_id: Mapped[int] = mapped_column(ForeignKey("calculations.id"), unique=True)
    certainty: Mapped[str] = mapped_column(String(32))
    summary: Mapped[str] = mapped_column(Text, default="")
    latex: Mapped[str] = mapped_column(Text, default="")
    numeric_value: Mapped[str] = mapped_column(String(255), default="")
    limitations: Mapped[str] = mapped_column(Text, default="")
    verification: Mapped[str] = mapped_column(Text, default="")

    calculation = relationship("Calculation", back_populates="result")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    project_id: Mapped[int | None] = mapped_column(ForeignKey("projects.id"), nullable=True)
    filename: Mapped[str] = mapped_column(String(255))
    original_name: Mapped[str] = mapped_column(String(255))
    mime: Mapped[str] = mapped_column(String(128), default="application/octet-stream")
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    extracted_text: Mapped[str] = mapped_column(Text, default="")
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    project = relationship("Project", back_populates="documents")
    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")
    shares = relationship("ShareLink", back_populates="document", cascade="all, delete-orphan")


class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"), index=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    filename: Mapped[str] = mapped_column(String(255))
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    document = relationship("Document", back_populates="versions")


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    project_id: Mapped[int | None] = mapped_column(ForeignKey("projects.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255))
    citation: Mapped[str] = mapped_column(Text, default="")
    url: Mapped[str] = mapped_column(String(512), default="")
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    note: Mapped[str] = mapped_column(Text, default="")


class Simulation(Base):
    __tablename__ = "simulations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    project_id: Mapped[int | None] = mapped_column(ForeignKey("projects.id"), nullable=True)
    lab: Mapped[str] = mapped_column(String(32), default="physics")
    title: Mapped[str] = mapped_column(String(255))
    assumptions: Mapped[str] = mapped_column(Text, default="[]")
    initial_conditions: Mapped[str] = mapped_column(Text, default="{}")
    constants: Mapped[str] = mapped_column(Text, default="{}")
    equations: Mapped[str] = mapped_column(Text, default="[]")
    output_payload: Mapped[str] = mapped_column(Text, default="{}")
    certainty: Mapped[str] = mapped_column(String(32), default="theoretical_model")
    seed: Mapped[str] = mapped_column(String(64), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    project = relationship("Project", back_populates="simulations")


class PdfExport(Base):
    __tablename__ = "pdf_exports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    project_id: Mapped[int | None] = mapped_column(ForeignKey("projects.id"), nullable=True)
    calculation_id: Mapped[int | None] = mapped_column(ForeignKey("calculations.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255))
    filename: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String(64))
    entity: Mapped[str] = mapped_column(String(64), default="")
    entity_id: Mapped[str] = mapped_column(String(64), default="")
    detail: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class ShareLink(Base):
    __tablename__ = "share_links"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"), index=True)
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    document = relationship("Document", back_populates="shares")


class Draft(Base):
    __tablename__ = "drafts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    key: Mapped[str] = mapped_column(String(128))
    payload: Mapped[str] = mapped_column(Text, default="{}")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    __table_args__ = (UniqueConstraint("user_id", "key", name="uq_user_draft_key"),)


class NumberAnalysis(Base):
    __tablename__ = "number_analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    project_id: Mapped[int | None] = mapped_column(ForeignKey("projects.id"), nullable=True)
    numbers_json: Mapped[str] = mapped_column(Text)
    result_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class AxiomWorld(Base):
    __tablename__ = "axiom_worlds"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    project_id: Mapped[int | None] = mapped_column(ForeignKey("projects.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255))
    definition_json: Mapped[str] = mapped_column(Text)
    analysis_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
