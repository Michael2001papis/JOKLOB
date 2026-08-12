from sqlalchemy.orm import Session
from . import models


def log(db: Session, user_id: int, action: str, entity: str = "", entity_id: str = "", detail: str = ""):
    db.add(
        models.ActivityLog(
            user_id=user_id,
            action=action,
            entity=entity,
            entity_id=str(entity_id) if entity_id is not None else "",
            detail=detail[:4000],
        )
    )
