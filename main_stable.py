from fastapi import FastAPI
from models import Layout, Component
from database import engine, SessionLocal, Base
from sqlalchemy.orm import Session

app = FastAPI()

Base.metadata.create_all(bind=engine)


# Seed dummy data once
@app.on_event("startup")
def seed_data():
    db = SessionLocal()
    existing = db.query(Layout).filter_by(name="demo-report").first()
    if not existing:
        layout = Layout(name="demo-report")
        component = Component(
            position=0,
            type="text",
            config={"data": "Hello from your first text block!"},
        )
        layout.components.append(component)
        db.add(layout)
        db.commit()
    db.close()


@app.get("/layouts/{name}")
def get_layout(name: str):
    db = SessionLocal()
    layout = db.query(Layout).filter_by(name=name).first()
    if not layout:
        return {"error": "Layout not found"}
    result = {
        "name": layout.name,
        "created_at": layout.created_at.isoformat(),
        "components": sorted(
            [
                {"type": c.type, "position": c.position, "config": c.config}
                for c in layout.components
            ],
            key=lambda x: x["position"],
        ),
    }
    db.close()
    return result
