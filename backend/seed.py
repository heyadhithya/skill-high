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


def attach_skill(db: Session, user_id: int, skill_id: int, level: str = "working") -> None:
    if not db.scalar(select(UserSkill).where(UserSkill.user_id == user_id, UserSkill.skill_id == skill_id)):
        db.add(UserSkill(user_id=user_id, skill_id=skill_id, level=level))


def add_service(db: Session, provider_id: int, title: str, description: str, amount_minor: int, estimated_hours: int, skill_names: list[str]) -> None:
    if db.scalar(select(Service).where(Service.provider_id == provider_id, Service.title == title)):
        return
    item = Service(provider_id=provider_id, title=title, description=description, amount_minor=amount_minor, currency="INR", estimated_hours=estimated_hours)
    db.add(item); db.flush()
    for name in skill_names:
        db.add(ServiceSkill(service_id=item.id, skill_id=skill(db, name).id))


def add_project(db: Session, client_id: int, title: str, description: str, amount_minor: int, estimated_hours: int, scale: str, skill_names: list[str]) -> None:
    if db.scalar(select(Project).where(Project.client_id == client_id, Project.title == title)):
        return
    item = Project(client_id=client_id, title=title, description=description, amount_minor=amount_minor, currency="INR", scale=scale, estimated_hours=estimated_hours)
    db.add(item); db.flush()
    for name in skill_names:
        db.add(ProjectSkill(project_id=item.id, skill_id=skill(db, name).id))


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
        attach_skill(db, designer.id, design.id, "strong")
        attach_skill(db, designer.id, frontend.id, "working")
        if not db.scalar(select(Service).where(Service.provider_id == designer.id, Service.title == "Campus event poster")):
            service = Service(provider_id=designer.id, title="Campus event poster", description="A polished poster sized for campus screens and social sharing.", amount_minor=180000, currency="INR", estimated_hours=3)
            db.add(service); db.flush(); db.add(ServiceSkill(service_id=service.id, skill_id=design.id))
        if not db.scalar(select(Project).where(Project.client_id == client.id, Project.title == "Landing page polish")):
            project = Project(client_id=client.id, title="Landing page polish", description="Improve the mobile layout and accessibility of a student society landing page.", amount_minor=350000, currency="INR", scale="small", estimated_hours=8)
            db.add(project); db.flush(); db.add(ProjectSkill(project_id=project.id, skill_id=frontend.id))

        nila = user(db, "nila@skillhigh-campus.com", "Nila Shah", "student")
        ishan = user(db, "ishan@skillhigh-campus.com", "Ishan Rao", "student")
        tara = user(db, "tara@skillhigh-campus.com", "Tara Sen", "graduate")
        kabir = user(db, "kabir@skillhigh-campus.com", "Kabir Das", "student")
        for owner, names in {
            nila: [("Frontend development", "strong"), ("Web design", "working"), ("Accessibility", "working")],
            ishan: [("Video editing", "strong")],
            tara: [("Copywriting", "strong"), ("Presentation design", "working")],
            kabir: [("Photo editing", "strong")],
        }.items():
            for name, level in names:
                attach_skill(db, owner.id, skill(db, name).id, level)

        add_service(db, designer.id, "Social media launch kit", "A coordinated set of launch graphics sized for two social channels.", 240000, 5, ["Graphic design", "Social media design"])
        add_service(db, nila.id, "Responsive portfolio website", "A focused portfolio site with responsive sections, navigation, and a contact route.", 650000, 12, ["Frontend development", "Web design"])
        add_service(db, nila.id, "Website mobile layout review", "A practical review of mobile layout issues with annotated fixes and accessibility notes.", 220000, 4, ["Frontend development", "Accessibility"])
        add_service(db, ishan.id, "Short-form video edit", "One short vertical edit with clean cuts, captions, and a supplied music track.", 280000, 5, ["Video editing"])
        add_service(db, tara.id, "Clear website copy", "A concise rewrite of one website page with headings, calls to action, and an editing pass.", 200000, 4, ["Copywriting"])
        add_service(db, tara.id, "Pitch deck layout", "A consistent layout pass for a short pitch deck using your supplied content.", 320000, 6, ["Presentation design"])
        add_service(db, kabir.id, "Product photo cleanup", "Background cleanup and color correction for a small set of product photos.", 160000, 3, ["Photo editing"])

        add_project(db, client.id, "Research report proofreading", "Proofread a student research report for structure, grammar, and clear citations.", 150000, 3, "micro", ["Copywriting"])
        add_project(db, client.id, "Club launch video", "Edit a short launch video from supplied clips and a simple shot list.", 300000, 6, "small", ["Video editing"])
        add_project(db, client.id, "Sponsor presentation refresh", "Refresh the structure and visual hierarchy of a sponsor presentation.", 240000, 5, "small", ["Presentation design"])
        db.commit()
    print("Seeded fictional accounts: admin@skillhigh-campus.com, ravi@skillhigh-campus.com, maya@skillhigh-campus.com")


if __name__ == "__main__":
    main()
