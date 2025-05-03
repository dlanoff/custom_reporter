from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import datetime

from database import Base, engine, SessionLocal
from models import Layout, Component


# ── FastAPI APP ──────────────────────────────────────────────────────────────────
app = FastAPI()

# --- CORS so CRA (localhost:3000) can talk to FastAPI (localhost:8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── DB SCHEMA CREATION ──────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)


# ── Pydantic input models ───────────────────────────────────────────────────────
class ComponentIn(BaseModel):
    position: int
    type: str
    config: dict


class LayoutIn(BaseModel):
    name: str
    components: List[ComponentIn]


# ── Seed demo report once on startup ────────────────────────────────────────────
@app.on_event("startup")
def seed_data() -> None:
    with SessionLocal() as db:
        if db.query(Layout).filter_by(name="demo-report").first():
            return

        demo = Layout(name="demo-report")
        demo.components.append(
            Component(
                position=0,
                type="text",
                config={"data": "Hello from your first text block!"},
            )
        )
        db.add(demo)
        db.commit()


# ── ROUTES ──────────────────────────────────────────────────────────────────────
@app.get("/layouts")
def list_layouts():
    with SessionLocal() as db:
        names = db.query(Layout.name).all()
        return [name for (name,) in names]


@app.get("/layouts/{name}")
def get_layout(name: str):
    with SessionLocal() as db:
        layout = db.query(Layout).filter_by(name=name).first()
        if not layout:
            raise HTTPException(status_code=404, detail="Layout not found")

        return {
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


@app.post("/layouts/")
def create_layout(layout_in: LayoutIn):
    with SessionLocal() as db:
        if db.query(Layout).filter_by(name=layout_in.name).first():
            raise HTTPException(
                status_code=400, detail="Layout with that name already exists"
            )

        layout = Layout(name=layout_in.name)
        db.add(layout)
        db.flush()  # ensures layout.id is available

        for comp in layout_in.components:
            db.add(
                Component(
                    layout_id=layout.id,
                    position=comp.position,
                    type=comp.type,
                    config=comp.config,
                )
            )

        db.commit()
        layout_name = layout.name  # still attached; safe to read
        return {"status": "created", "name": layout_name}


@app.put("/layouts/{name}")
def update_layout(name: str, layout_in: LayoutIn):
    with SessionLocal() as db:
        layout = db.query(Layout).filter_by(name=name).first()
        if not layout:
            raise HTTPException(status_code=404, detail="Layout not found")

        db.query(Component).filter_by(layout_id=layout.id).delete()

        for comp in layout_in.components:
            db.add(
                Component(
                    layout_id=layout.id,
                    position=comp.position,
                    type=comp.type,
                    config=comp.config,
                )
            )

        db.commit()
        return {"status": "updated", "name": layout.name}


@app.delete("/layouts/{name}")
def delete_layout(name: str):
    with SessionLocal() as db:
        layout = db.query(Layout).filter_by(name=name).first()
        if not layout:
            raise HTTPException(status_code=404, detail="Layout not found")
        db.delete(layout)
        db.commit()
        return {"status": "deleted"}
