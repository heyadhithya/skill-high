"""Idempotent fictional records for local development only."""

import os

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app import Base, PASSWORDS, Project, ProjectSkill, Service, ServiceSkill, Skill, User, UserSkill


URL = os.getenv("DATABASE_URL", "postgresql+psycopg://skillhigh:skillhigh@127.0.0.1:54329/skillhigh_dev")


def skill(db: Session, name: str) -> Skill:
    item = db.scalar(select(Skill).where(Skill.name == name))
    if not item:
        item = Skill(name=name)
        db.add(item)
        db.flush()
    return item


def user(db: Session, email: str, name: str, stage: str, admin: bool = False) -> User:
    item = db.scalar(select(User).where(User.email == email))
    if not item:
        item = User(email=email, display_name=name, career_stage=stage, is_admin=admin, is_verified=True, password_hash=PASSWORDS.hash("skillhigh-demo-123"))
        db.add(item)
        db.flush()
    return item


def main() -> None:
    if os.getenv("APP_ENV", "development") == "production":
        raise SystemExit("Seed data is disabled in production")
    engine = create_engine(URL)
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        admin = user(db, "admin@skillhigh-campus.com", "Aarav Admin", "graduate", True)
        designer = user(db, "ravi@skillhigh-campus.com", "Ravi Mehta", "student")
        client = user(db, "maya@skillhigh-campus.com", "Maya Kapoor", "graduate")
        design = skill(db, "Poster design")
        frontend = skill(db, "Frontend development")
        for item in (UserSkill(user_id=designer.id, skill_id=design.id, level="strong"), UserSkill(user_id=designer.id, skill_id=frontend.id, level="working")):
            if not db.scalar(select(UserSkill).where(UserSkill.user_id == item.user_id, UserSkill.skill_id == item.skill_id)):
                db.add(item)
        if not db.scalar(select(Service).where(Service.provider_id == designer.id, Service.title == "Campus event poster")):
            service = Service(provider_id=designer.id, title="Campus event poster", description="A polished poster sized for campus screens and social sharing.", amount_minor=180000, currency="INR", estimated_hours=3)
            db.add(service); db.flush(); db.add(ServiceSkill(service_id=service.id, skill_id=design.id))
        if not db.scalar(select(Project).where(Project.client_id == client.id, Project.title == "Landing page polish")):
            project = Project(client_id=client.id, title="Landing page polish", description="Improve the mobile layout and accessibility of a student society landing page.", amount_minor=350000, currency="INR", scale="small", estimated_hours=8)
            db.add(project); db.flush(); db.add(ProjectSkill(project_id=project.id, skill_id=frontend.id))
        db.commit()
    print("Seeded fictional accounts: admin@skillhigh-campus.com, ravi@skillhigh-campus.com, maya@skillhigh-campus.com")


if __name__ == "__main__":
    main()
