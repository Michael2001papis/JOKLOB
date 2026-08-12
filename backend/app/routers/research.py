import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import models
from ..activity import log
from ..auth import get_current_user
from ..certainty import pack
from ..db import get_db
from ..services import math_engine, nl_parser, numbers_lab

router = APIRouter(prefix="/api/research", tags=["research"])


class ParseIn(BaseModel):
    text: str
    project_id: int | None = None


class ConfirmIn(BaseModel):
    problem_id: int
    variables: list[dict] = []
    assumptions: list[dict] = []
    expression: str | None = None
    intent: str | None = None
    extra: dict = {}


@router.post("/parse")
def parse_text(body: ParseIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    parsed = nl_parser.parse(body.text)
    project_id = body.project_id
    if project_id:
        p = db.get(models.Project, project_id)
        if not p or p.user_id != user.id:
            raise HTTPException(404, "Project not found")
    else:
        p = models.Project(
            user_id=user.id,
            title=(body.text[:48] + "…") if len(body.text) > 48 else (body.text or "Untitled"),
            description=body.text,
            domain=parsed.domain,
        )
        db.add(p)
        db.flush()
        project_id = p.id
    problem = models.ResearchProblem(
        project_id=project_id,
        user_id=user.id,
        natural_language=body.text,
        language=parsed.language,
        domain=parsed.domain,
        formal_statement=parsed.formal_statement,
        missing_data=json.dumps(parsed.missing, ensure_ascii=False),
        status="parsed",
    )
    db.add(problem)
    db.flush()
    for v in parsed.variables:
        db.add(
            models.ProblemVariable(
                problem_id=problem.id,
                name=v.get("name", ""),
                symbol=v.get("symbol", ""),
                value=str(v.get("value", "")),
                unit=v.get("unit", ""),
                description=v.get("description", ""),
            )
        )
    for a in parsed.assumptions:
        db.add(models.Assumption(problem_id=problem.id, text=a, kind="modeling"))
    log(db, user.id, "parse", "problem", problem.id, body.text[:200])
    db.commit()
    db.refresh(problem)
    return {
        "problem_id": problem.id,
        "project_id": project_id,
        "parsed": nl_parser.as_dict(parsed),
        "certainty": pack(parsed.certainty_hint),
    }


@router.get("/problems")
def list_problems(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    rows = (
        db.query(models.ResearchProblem)
        .filter(models.ResearchProblem.user_id == user.id)
        .order_by(models.ResearchProblem.created_at.desc())
        .limit(100)
        .all()
    )
    return [
        {
            "id": r.id,
            "project_id": r.project_id,
            "natural_language": r.natural_language,
            "formal_statement": r.formal_statement,
            "domain": r.domain,
            "status": r.status,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


@router.get("/problems/{pid}")
def get_problem(pid: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    r = db.get(models.ResearchProblem, pid)
    if not r or r.user_id != user.id:
        raise HTTPException(404, "Not found")
    return {
        "id": r.id,
        "project_id": r.project_id,
        "natural_language": r.natural_language,
        "formal_statement": r.formal_statement,
        "domain": r.domain,
        "missing": json.loads(r.missing_data or "[]"),
        "status": r.status,
        "variables": [
            {"id": v.id, "name": v.name, "symbol": v.symbol, "value": v.value, "unit": v.unit, "description": v.description, "confirmed": v.confirmed}
            for v in r.variables
        ],
        "assumptions": [{"id": a.id, "text": a.text, "kind": a.kind, "confirmed": a.confirmed} for a in r.assumptions],
        "calculations": [
            {"id": c.id, "certainty": c.certainty, "created_at": c.created_at.isoformat()} for c in r.calculations
        ],
    }


@router.post("/solve")
def confirm_and_solve(body: ConfirmIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    r = db.get(models.ResearchProblem, body.problem_id)
    if not r or r.user_id != user.id:
        raise HTTPException(404, "Not found")
    parsed = nl_parser.parse(r.natural_language)
    if parsed.blocked == "gambling":
        return {"ok": False, "blocked": "gambling", "parsed": nl_parser.as_dict(parsed), "certainty": pack("contradiction_impossible")}

    # update vars/assumptions
    if body.variables:
        for item in body.variables:
            vid = item.get("id")
            if vid:
                v = db.get(models.ProblemVariable, vid)
                if v and v.problem_id == r.id:
                    v.value = str(item.get("value", v.value))
                    v.unit = item.get("unit", v.unit)
                    v.confirmed = bool(item.get("confirmed", True))
    if body.assumptions:
        for item in body.assumptions:
            aid = item.get("id")
            if aid:
                a = db.get(models.Assumption, aid)
                if a and a.problem_id == r.id:
                    a.text = item.get("text", a.text)
                    a.confirmed = bool(item.get("confirmed", True))

    intent = body.intent or parsed.intent
    expr = body.expression or parsed.expression or ""

    if intent == "number_lab" or (not expr and parsed.extracted_numbers):
        result = numbers_lab.analyze(parsed.extracted_numbers)
    elif intent == "units":
        result = math_engine.check_units(expr)
        result = {"ok": result.get("ok"), "kind": "units", "units": result, "steps": [], "certainty": result.get("certainty"), "result_latex": "", "result_text": json.dumps(result)}
    elif intent in {"ode"} or r.domain == "ode":
        result = math_engine.ode_solve(expr)
    elif intent in {"fourier", "laplace"} or r.domain == "fourier":
        result = math_engine.fourier_laplace(expr, "laplace" if "laplace" in (expr + r.natural_language).lower() else "fourier")
    else:
        result = math_engine.solve_problem(expr, intent=intent if intent != "counterfactual_simulation" else "solve", extra=body.extra)

    if parsed.intent == "counterfactual_simulation":
        result["certainty"] = pack("theoretical_model")
        result["limitations"] = (
            (result.get("limitations") or "")
            + " Counterfactual physics request: labelled as a theoretical model, not an experimental fact."
        )

    calc = models.Calculation(
        problem_id=r.id,
        user_id=user.id,
        engine="sympy",
        input_payload=json.dumps({"expression": expr, "intent": intent}, ensure_ascii=False),
        output_payload=json.dumps(result, ensure_ascii=False, default=str),
        certainty=(result.get("certainty") or {}).get("code", "partial"),
    )
    db.add(calc)
    db.flush()
    for st in result.get("steps") or []:
        db.add(
            models.SolutionStep(
                calculation_id=calc.id,
                ord=st.get("ord", 0),
                title=st.get("title", ""),
                explanation=st.get("explanation", ""),
                latex=st.get("latex", ""),
                method=st.get("method", ""),
            )
        )
    db.add(
        models.Result(
            calculation_id=calc.id,
            certainty=calc.certainty,
            summary=str(result.get("result_text") or result.get("error") or "")[:4000],
            latex=str(result.get("result_latex") or ""),
            numeric_value=str(result.get("numeric") or ""),
            limitations=str(result.get("limitations") or ""),
            verification=json.dumps(result.get("verification"), ensure_ascii=False, default=str),
        )
    )
    r.status = "solved" if result.get("ok") else "failed"
    r.formal_statement = body.expression or r.formal_statement
    log(db, user.id, "solve", "calculation", calc.id)
    db.commit()
    return {"ok": True, "calculation_id": calc.id, "problem_id": r.id, "project_id": r.project_id, "result": result}


@router.get("/calculations/{cid}")
def get_calc(cid: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    c = db.get(models.Calculation, cid)
    if not c or c.user_id != user.id:
        raise HTTPException(404, "Not found")
    return {
        "id": c.id,
        "certainty": pack(c.certainty),
        "created_at": c.created_at.isoformat(),
        "output": json.loads(c.output_payload or "{}"),
        "steps": [
            {"ord": s.ord, "title": s.title, "explanation": s.explanation, "latex": s.latex, "method": s.method}
            for s in sorted(c.steps, key=lambda x: x.ord)
        ],
    }
