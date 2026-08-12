from sqlalchemy.orm import Session

from . import models
from .auth import hash_password


def seed_if_empty(db: Session):
    if db.query(models.User).first():
        return
    user = models.User(
        email="demo@joklob.local",
        name="חוקר הדגמה",
        password_hash=hash_password("demo12345"),
        language="he",
        theme="dark",
    )
    db.add(user)
    db.flush()
    p1 = models.Project(
        user_id=user.id,
        title="נגזרות ואינטגרלים — הדגמה",
        description="פרויקט פתיחה עם חישובים סימבוליים מאומתים.",
        domain="calculus",
    )
    p2 = models.Project(
        user_id=user.id,
        title="סדרות מספריות",
        description="ניתוח רשימות מספרים בלי ניבוי הימורים.",
        domain="number_theory",
    )
    db.add_all([p1, p2])
    db.flush()
    db.add(
        models.ResearchProblem(
            project_id=p1.id,
            user_id=user.id,
            natural_language="פתור: x^2 - 5*x + 6 = 0",
            language="he",
            domain="algebra",
            formal_statement="פתור את המשוואה: x^2 - 5*x + 6 = 0",
            missing_data="[]",
            status="draft",
        )
    )
    db.add(
        models.ActivityLog(
            user_id=user.id,
            action="seed",
            entity="user",
            entity_id=str(user.id),
            detail="Demo user demo@joklob.local / demo12345",
        )
    )
    db.commit()
