from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Layout(Base):
    __tablename__ = "layouts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    components = relationship(
        "Component", back_populates="layout", cascade="all, delete"
    )


class Component(Base):
    __tablename__ = "components"

    id = Column(Integer, primary_key=True, index=True)
    layout_id = Column(Integer, ForeignKey("layouts.id"))
    position = Column(Integer)
    type = Column(String)  # "text", "image", "table", "graph"
    config = Column(JSON)

    layout = relationship("Layout", back_populates="components")
