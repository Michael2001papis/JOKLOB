import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .. import models
from ..activity import log
from ..auth import get_current_user
from ..certainty import pack
from ..db import get_db
from ..services import axiom_lab, between_numbers, math_engine, numbers_lab, physics_lab

router = APIRouter(prefix="/api/labs", tags=["labs"])


class NumbersIn(BaseModel):
    numbers: list[float] = Field(min_length=1, max_length=64)
    project_id: int | None = None
    combine_method: str | None = None
    explode: dict | None = None


class BetweenIn(BaseModel):
    a: float
    b: float
    depth: int = 4
    zoom: float = 1.0


class PhysicsIn(BaseModel):
    scenario: str
    params: dict = {}
    project_id: int | None = None
    title: str = ""


class AxiomIn(BaseModel):
    title: str = "Experimental world"
    project_id: int | None = None
    definition: dict


class MathIn(BaseModel):
    expression: str
    intent: str = "solve"
    variable: str | None = None
    extra: dict = {}


@router.post("/math")
def math_direct(body: MathIn, user: models.User = Depends(get_current_user)):
    if body.intent == "ode":
        out = math_engine.ode_solve(body.expression)
    elif body.intent in {"fourier", "laplace"}:
        out = math_engine.fourier_laplace(body.expression, body.intent)
    elif body.intent == "units":
        out = {"ok": True, "units": math_engine.check_units(body.expression), "certainty": math_engine.check_units(body.expression).get("certainty"), "steps": []}
    else:
        out = math_engine.solve_problem(body.expression, intent=body.intent, variable=body.variable, extra=body.extra)
    return out


@router.post("/numbers")
def numbers(body: NumbersIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    analysis = numbers_lab.analyze(body.numbers)
    extra = {}
    if body.combine_method:
        extra["combine"] = numbers_lab.combine_to_one(body.numbers, body.combine_method)
    if body.explode:
        extra["explode"] = numbers_lab.one_to_many(
            float(body.explode.get("value", body.numbers[0])),
            int(body.explode.get("k", 6)),
            body.explode.get("constraints") or {},
        )
    row = models.NumberAnalysis(
        user_id=user.id,
        project_id=body.project_id,
        numbers_json=json.dumps(body.numbers),
        result_json=json.dumps({"analysis": analysis, "extra": extra}, ensure_ascii=False, default=str),
    )
    db.add(row)
    log(db, user.id, "numbers", "analysis", "", str(body.numbers)[:200])
    db.commit()
    return {"ok": True, "id": row.id, "analysis": analysis, "extra": extra, "certainty": pack(analysis.get("certainty", "partial"))}


@router.post("/between")
def between(body: BetweenIn, user: models.User = Depends(get_current_user)):
    return between_numbers.explore(body.a, body.b, body.depth, body.zoom)


@router.post("/physics")
def physics(body: PhysicsIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    out = physics_lab.run(body.scenario, body.params)
    sim = models.Simulation(
        user_id=user.id,
        project_id=body.project_id,
        lab="physics",
        title=body.title or body.scenario,
        assumptions=json.dumps(out.get("assumptions") or [], ensure_ascii=False),
        initial_conditions=json.dumps(out.get("initial_conditions") or {}, default=str),
        constants=json.dumps(out.get("constants") or {}, default=str),
        equations=json.dumps(out.get("equations") or [], ensure_ascii=False),
        output_payload=json.dumps(out, ensure_ascii=False, default=str),
        certainty=out.get("certainty", "theoretical_model"),
        seed=str(out.get("repro_seed") or ""),
    )
    db.add(sim)
    log(db, user.id, "simulate", "physics", body.scenario)
    db.commit()
    db.refresh(sim)
    out["simulation_id"] = sim.id
    out["certainty_pack"] = pack(out.get("certainty", "theoretical_model"))
    return out


@router.get("/physics/scenarios")
def physics_scenarios(user: models.User = Depends(get_current_user)):
    return {
        "scenarios": [
            {"id": "projectile", "he": "קליע / מכניקה קלאסית", "en": "Projectile (classical)"},
            {"id": "oscillator", "he": "מתנד הרמוני", "en": "Harmonic oscillator"},
            {"id": "newton_force", "he": "כוח ניוטון בין שתי מסות", "en": "Newtonian two-body force"},
            {"id": "cyclotron", "he": "תנועת ציקלודרון (EM)", "en": "Cyclotron motion"},
            {"id": "time_dilation", "he": "התארכות זמן (יחסות פרטית)", "en": "SR time dilation"},
            {"id": "infinite_well", "he": "חלקיק בבור אינסופי", "en": "Particle in a box"},
            {"id": "rabi", "he": "מערכת דו-מצבית / Rabi", "en": "Two-level Rabi (QuTiP if available)"},
            {"id": "hubble", "he": "חוק האבל הליניארי", "en": "Linear Hubble law"},
        ]
    }


@router.post("/axioms")
def axioms(body: AxiomIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    analysis = axiom_lab.analyze_world(body.definition)
    row = models.AxiomWorld(
        user_id=user.id,
        project_id=body.project_id,
        title=body.title,
        definition_json=json.dumps(body.definition, ensure_ascii=False),
        analysis_json=json.dumps(analysis, ensure_ascii=False, default=str),
    )
    db.add(row)
    log(db, user.id, "axioms", "world", body.title)
    db.commit()
    db.refresh(row)
    return {"ok": True, "id": row.id, "analysis": analysis, "certainty": pack(analysis.get("certainty", "partial"))}
