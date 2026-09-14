"""Skill-High's deliberately small modular-monolith API."""

from __future__ import annotations

import os
import secrets
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Generator, Literal

from argon2 import PasswordHasher
from fastapi import Cookie, Depends, FastAPI, File, Header, HTTPException, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, create_engine, func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker
from urllib.parse import urlsplit

DEFAULT_DATABASE_URL = "postgresql+psycopg://skillhigh:skillhigh@127.0.0.1:54329/skillhigh_dev"
PASSWORDS = PasswordHasher()
COOKIE_NAME, CSRF_COOKIE = "sh_session", "sh_csrf"


def integration_database_url() -> str:
    """Keep integration tests out of the local development database."""
    configured = os.getenv("TEST_DATABASE_URL")
    if configured:
        return configured
    return make_url(os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)).set(database="skillhigh_test").render_as_string(hide_password=False)


def ensure_test_database(database_url: str) -> None:
    target = make_url(database_url)
    development = make_url(os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL))
    if target.get_backend_name() != "postgresql" or not target.database or target.database == development.database:
        raise RuntimeError("TEST_DATABASE_URL must point to a PostgreSQL database separate from DATABASE_URL")
    if not target.database.replace("_", "").isalnum():
        raise RuntimeError("TEST_DATABASE_URL database name must contain only letters, numbers, and underscores")
    admin_engine = create_engine(target.set(database="postgres"), isolation_level="AUTOCOMMIT")
    try:
        with admin_engine.connect() as connection:
            exists = connection.execute(text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": target.database}).scalar()
            if not exists:
                connection.execute(text(f'CREATE DATABASE "{target.database}"'))
    finally:
        admin_engine.dispose()


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(512))
    display_name: Mapped[str] = mapped_column(String(100))
    career_stage: Mapped[str] = mapped_column(String(20), default="student")
    timezone: Mapped[str] = mapped_column(String(64), default="UTC")
    bio: Mapped[str] = mapped_column(Text, default="")
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


class LoginSession(Base):
    __tablename__ = "login_sessions"
    id: Mapped[str] = mapped_column(String(96), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    csrf_token: Mapped[str] = mapped_column(String(96))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class AuthToken(Base):
    __tablename__ = "auth_tokens"
    id: Mapped[int] = mapped_column(primary_key=True)
    token: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    purpose: Mapped[str] = mapped_column(String(32))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Skill(Base):
    __tablename__ = "skills"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)


class UserSkill(Base):
    __tablename__ = "user_skills"
    __table_args__ = (UniqueConstraint("user_id", "skill_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"), index=True)
    level: Mapped[str] = mapped_column(String(20), default="learning")


class Availability(Base):
    __tablename__ = "availability"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    hours_per_week: Mapped[int] = mapped_column(Integer, default=0)
    note: Mapped[str] = mapped_column(String(300), default="")


class Service(Base):
    __tablename__ = "services"
    id: Mapped[int] = mapped_column(primary_key=True)
    provider_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(140))
    description: Mapped[str] = mapped_column(Text)
    amount_minor: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    estimated_hours: Mapped[int] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


class ServiceSkill(Base):
    __tablename__ = "service_skills"
    __table_args__ = (UniqueConstraint("service_id", "skill_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id", ondelete="CASCADE"))
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"))


class Project(Base):
    __tablename__ = "projects"
    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(140), index=True)
    description: Mapped[str] = mapped_column(Text)
    amount_minor: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    scale: Mapped[str] = mapped_column(String(20), default="micro", index=True)
    estimated_hours: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default="open", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


class ProjectSkill(Base):
    __tablename__ = "project_skills"
    __table_args__ = (UniqueConstraint("project_id", "skill_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"))


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("project_id", "worker_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    worker_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


class Order(Base):
    __tablename__ = "orders"
    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    worker_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    project_id: Mapped[int | None] = mapped_column(ForeignKey("projects.id", ondelete="SET NULL"), unique=True, nullable=True)
    service_id: Mapped[int | None] = mapped_column(ForeignKey("services.id", ondelete="SET NULL"), nullable=True)
    latest_delivery_id: Mapped[int | None] = mapped_column(ForeignKey("deliveries.id", ondelete="SET NULL", name="fk_orders_latest_delivery", use_alter=True), nullable=True)
    title: Mapped[str] = mapped_column(String(140))
    scope_snapshot: Mapped[str] = mapped_column(Text)
    skills_snapshot: Mapped[str] = mapped_column(Text, default="")
    amount_minor: Mapped[int] = mapped_column(Integer)
    fee_minor: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(3))
    estimated_hours: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(24), default="pending_acceptance", index=True)
    payment_status: Mapped[str] = mapped_column(String(24), default="unpaid")
    payout_status: Mapped[str] = mapped_column(String(24), default="not_ready")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


class Delivery(Base):
    __tablename__ = "deliveries"
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    message: Mapped[str] = mapped_column(Text)
    submission_url: Mapped[str] = mapped_column(String(500), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


class OrderMessage(Base):
    __tablename__ = "order_messages"
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


class ProofOfWork(Base):
    __tablename__ = "proof_of_work"
    __table_args__ = (UniqueConstraint("order_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"))
    worker_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(140))
    public: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("order_id", "author_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    recipient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    rating: Mapped[int] = mapped_column(Integer)
    body: Mapped[str] = mapped_column(Text)


class Dispute(Base):
    __tablename__ = "disputes"
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    reporter_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    reason: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="open")


class PaymentEvent(Base):
    __tablename__ = "payment_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    provider_event_id: Mapped[str] = mapped_column(String(120), unique=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    event_type: Mapped[str] = mapped_column(String(40))


class AuditEvent(Base):
    __tablename__ = "audit_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    actor_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(80))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    display_name: str = Field(min_length=2, max_length=100)
    career_stage: Literal["student", "graduate"] = "student"
    timezone: str = Field(default="UTC", max_length=64)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class EmailIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str = Field(min_length=20, max_length=128)
    password: str = Field(min_length=12, max_length=128)


class ProfileIn(BaseModel):
    display_name: str | None = Field(default=None, min_length=2, max_length=100)
    bio: str | None = Field(default=None, max_length=2000)
    career_stage: Literal["student", "graduate"] | None = None
    timezone: str | None = Field(default=None, max_length=64)


class SkillIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    level: Literal["learning", "working", "strong"] = "learning"


class ProjectIn(BaseModel):
    title: str = Field(min_length=4, max_length=140)
    description: str = Field(min_length=10, max_length=5000)
    amount_minor: int = Field(gt=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    scale: Literal["micro", "small", "medium", "large", "long_term"] = "micro"
    estimated_hours: int = Field(gt=0, le=200)
    required_skills: list[str] = Field(default_factory=list)


class ServiceIn(BaseModel):
    title: str = Field(min_length=4, max_length=140)
    description: str = Field(min_length=10, max_length=5000)
    amount_minor: int = Field(gt=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    estimated_hours: int = Field(gt=0, le=200)
    skills: list[str] = Field(default_factory=list)


class VisibilityIn(BaseModel):
    is_active: bool


class ProofVisibilityIn(BaseModel):
    public: bool


class DeliveryIn(BaseModel):
    message: str = Field(min_length=1, max_length=5000)
    submission_url: str = Field(default="", max_length=500)

    @field_validator("submission_url")
    @classmethod
    def validate_submission_url(cls, value: str) -> str:
        value = value.strip()
        if not value:
            return value
        parsed = urlsplit(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("submission_url must be an absolute HTTP(S) URL")
        return value


class MessageIn(BaseModel):
    body: str = Field(min_length=1, max_length=5000)


class CompleteIn(BaseModel):
    delivery_id: int


class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    body: str = Field(min_length=2, max_length=2000)


class DisputeIn(BaseModel):
    reason: str = Field(min_length=4, max_length=2000)


def serialize_user(user: User) -> dict:
    return {"id": user.id, "email": user.email, "display_name": user.display_name, "career_stage": user.career_stage, "timezone": user.timezone, "bio": user.bio, "is_admin": user.is_admin, "is_verified": user.is_verified}


def serialize_order(order: Order) -> dict:
    return {"id": order.id, "client_id": order.client_id, "worker_id": order.worker_id, "title": order.title, "scope_snapshot": order.scope_snapshot, "amount_minor": order.amount_minor, "fee_minor": order.fee_minor, "currency": order.currency, "estimated_hours": order.estimated_hours, "status": order.status, "payment_status": order.payment_status, "payout_status": order.payout_status, "latest_delivery_id": order.latest_delivery_id}


def create_app(database_url: str | None = None, testing: bool = False) -> FastAPI:
    resolved_database_url = database_url or (integration_database_url() if testing else os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL))
    if testing:
        ensure_test_database(resolved_database_url)
    engine = create_engine(resolved_database_url, pool_pre_ping=True)
    session_factory = sessionmaker(engine, expire_on_commit=False)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        if testing:
            # Tests own this dedicated database; schema reset also handles FK cycles.
            with engine.begin() as connection:
                connection.exec_driver_sql("DROP SCHEMA public CASCADE")
                connection.exec_driver_sql("CREATE SCHEMA public")
        Base.metadata.create_all(engine)
        yield
        engine.dispose()

    app = FastAPI(title="Skill-High API", version="0.1.0", lifespan=lifespan)
    app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

    def db_session() -> Generator[Session, None, None]:
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    def current_user(db: Session = Depends(db_session), session_id: str | None = Cookie(default=None, alias=COOKIE_NAME)) -> User:
        if not session_id:
            raise HTTPException(status_code=401, detail="Sign in required")
        login = db.get(LoginSession, session_id)
        if not login or login.expires_at < datetime.now(UTC):
            raise HTTPException(status_code=401, detail="Session expired")
        user = db.get(User, login.user_id)
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="Account unavailable")
        return user

    def csrf_guard(db: Session = Depends(db_session), session_id: str | None = Cookie(default=None, alias=COOKIE_NAME), csrf_token: str | None = Header(default=None, alias="X-CSRF-Token")) -> None:
        login = db.get(LoginSession, session_id) if session_id else None
        if not login or not csrf_token or not secrets.compare_digest(login.csrf_token, csrf_token):
            raise HTTPException(status_code=403, detail="Invalid CSRF token")

    def actor(user: User = Depends(current_user), _: None = Depends(csrf_guard)) -> User:
        return user

    def get_skill(db: Session, name: str) -> Skill:
        clean = name.strip()
        skill = db.scalar(select(Skill).where(func.lower(Skill.name) == clean.lower()))
        if not skill:
            skill = Skill(name=clean)
            db.add(skill)
            db.flush()
        return skill

    def normalized_skill_names(names: list[str]) -> list[str]:
        result: list[str] = []
        seen: set[str] = set()
        for name in names:
            clean = name.strip()
            key = clean.casefold()
            if not 2 <= len(clean) <= 80:
                raise HTTPException(422, "Skill names must be between 2 and 80 characters")
            if key not in seen:
                seen.add(key)
                result.append(clean)
        return result

    def public_person(db: Session, user_id: int) -> dict:
        user = db.get(User, user_id)
        if not user:
            return {"id": user_id, "display_name": "Unknown member", "career_stage": "student", "bio": "", "skills": []}
        skills = db.scalars(select(Skill.name).join(UserSkill).where(UserSkill.user_id == user_id).order_by(Skill.name)).all()
        return {"id": user.id, "display_name": user.display_name, "career_stage": user.career_stage, "bio": user.bio, "skills": skills}

    def service_skills(db: Session, service_id: int) -> list[str]:
        return db.scalars(select(Skill.name).join(ServiceSkill).where(ServiceSkill.service_id == service_id).order_by(ServiceSkill.id)).all()

    def project_skills(db: Session, project_id: int) -> list[str]:
        return db.scalars(select(Skill.name).join(ProjectSkill).where(ProjectSkill.project_id == project_id).order_by(ProjectSkill.id)).all()

    def seller_reviews(db: Session, provider_id: int) -> list[dict]:
        rows = db.execute(
            select(Review, User.display_name)
            .join(User, User.id == Review.author_id)
            .join(Order, Order.id == Review.order_id)
            .where(Review.recipient_id == provider_id, Review.author_id == Order.client_id, Order.worker_id == provider_id, Order.status == "completed")
            .order_by(Review.id.desc())
        ).all()
        return [{"id": review.id, "rating": review.rating, "body": review.body, "author_name": author_name} for review, author_name in rows]

    def serialize_service(db: Session, service: Service, detail: bool = False) -> dict:
        reviews = seller_reviews(db, service.provider_id)
        result = {
            "id": service.id,
            "provider_id": service.provider_id,
            "title": service.title,
            "description": service.description,
            "amount_minor": service.amount_minor,
            "currency": service.currency,
            "estimated_hours": service.estimated_hours,
            "created_at": service.created_at,
            "is_active": service.is_active,
            "skills": service_skills(db, service.id),
            "provider": public_person(db, service.provider_id),
            "seller_rating": round(sum(item["rating"] for item in reviews) / len(reviews), 1) if reviews else None,
            "seller_review_count": len(reviews),
        }
        if detail:
            result["seller_reviews"] = reviews
        return result

    def serialize_project(db: Session, project: Project, include_status: bool = True) -> dict:
        result = {
            "id": project.id,
            "client_id": project.client_id,
            "title": project.title,
            "description": project.description,
            "amount_minor": project.amount_minor,
            "currency": project.currency,
            "estimated_hours": project.estimated_hours,
            "scale": project.scale,
            "created_at": project.created_at,
            "required_skills": project_skills(db, project.id),
            "client": public_person(db, project.client_id),
        }
        if include_status:
            result["status"] = project.status
        return result

    def serialize_order_detail(db: Session, order: Order) -> dict:
        result = serialize_order(order)
        result.update({
            "project_id": order.project_id,
            "service_id": order.service_id,
            "created_at": order.created_at,
            "client": public_person(db, order.client_id),
            "worker": public_person(db, order.worker_id),
            "deliveries": [
                {"id": row.id, "author_id": row.author_id, "message": row.message, "submission_url": row.submission_url, "created_at": row.created_at}
                for row in db.scalars(select(Delivery).where(Delivery.order_id == order.id).order_by(Delivery.id)).all()
            ],
            "reviews": [
                {"id": row.id, "author_id": row.author_id, "recipient_id": row.recipient_id, "rating": row.rating, "body": row.body}
                for row in db.scalars(select(Review).where(Review.order_id == order.id).order_by(Review.id)).all()
            ],
            "disputes": [
                {"id": row.id, "reason": row.reason, "status": row.status}
                for row in db.scalars(select(Dispute).where(Dispute.order_id == order.id).order_by(Dispute.id)).all()
            ],
        })
        return result

    def serialize_order_summary(db: Session, order: Order) -> dict:
        latest = db.scalar(select(OrderMessage).where(OrderMessage.order_id == order.id).order_by(OrderMessage.id.desc()).limit(1))
        return {
            **serialize_order(order),
            "project_id": order.project_id,
            "service_id": order.service_id,
            "created_at": order.created_at,
            "client": public_person(db, order.client_id),
            "worker": public_person(db, order.worker_id),
            "last_message": {"id": latest.id, "author_id": latest.author_id, "body": latest.body, "created_at": latest.created_at} if latest else None,
        }

    def participant(db: Session, order_id: int, user: User, lock: bool = False) -> Order:
        stmt = select(Order).where(Order.id == order_id)
        if lock: stmt = stmt.with_for_update()
        order = db.scalar(stmt)
        if not order:
            raise HTTPException(404, "Order not found")
        if user.id not in {order.client_id, order.worker_id}:
            raise HTTPException(403, "Order access denied")
        return order

    def audit(db: Session, order_id: int | None, user_id: int, action: str) -> None:
        db.add(AuditEvent(order_id=order_id, actor_id=user_id, action=action))

    def issue_token(db: Session, user: User, purpose: str) -> None:
        token = AuthToken(token=secrets.token_urlsafe(48), user_id=user.id, purpose=purpose, expires_at=datetime.now(UTC) + timedelta(hours=1))
        db.add(token)
        if os.getenv("APP_ENV", "development") == "development":
            mail_dir = Path(os.getenv("DEV_MAIL_DIR", ".data/dev-mail"))
            mail_dir.mkdir(parents=True, exist_ok=True)
            view = "reset-password" if purpose == "password-reset" else "verify-email"
            (mail_dir / f"{purpose}-{token.token}.txt").write_text(
                f"To: {user.email}\nOpen: http://127.0.0.1:3000/?view={view}&token={token.token}\ntoken={token.token}\n"
            )

    @app.get("/api/v1/health")
    def health() -> dict: return {"status": "ok"}

    @app.post("/api/v1/auth/register", status_code=201)
    def register(payload: RegisterIn, response: Response, db: Session = Depends(db_session)) -> dict:
        if db.scalar(select(User).where(User.email == payload.email.lower())): raise HTTPException(409, "Email already registered")
        user = User(email=payload.email.lower(), password_hash=PASSWORDS.hash(payload.password), display_name=payload.display_name.strip(), career_stage=payload.career_stage, timezone=payload.timezone)
        db.add(user); db.flush()
        issue_token(db, user, "verification")
        login = LoginSession(id=secrets.token_urlsafe(48), user_id=user.id, csrf_token=secrets.token_urlsafe(32), expires_at=datetime.now(UTC) + timedelta(days=14))
        db.add(login); db.commit()
        secure = os.getenv("APP_ENV") == "production"
        response.set_cookie(COOKIE_NAME, login.id, httponly=True, samesite="lax", secure=secure, max_age=14 * 86400)
        response.set_cookie(CSRF_COOKIE, login.csrf_token, httponly=False, samesite="lax", secure=secure, max_age=14 * 86400)
        return serialize_user(user)

    @app.post("/api/v1/auth/login")
    def login(payload: LoginIn, response: Response, db: Session = Depends(db_session)) -> dict:
        user = db.scalar(select(User).where(User.email == payload.email.lower()))
        try: valid = bool(user and user.is_active and PASSWORDS.verify(user.password_hash, payload.password))
        except Exception: valid = False
        if not valid: raise HTTPException(401, "Invalid email or password")
        login = LoginSession(id=secrets.token_urlsafe(48), user_id=user.id, csrf_token=secrets.token_urlsafe(32), expires_at=datetime.now(UTC) + timedelta(days=14))
        db.add(login); db.commit()
        secure = os.getenv("APP_ENV") == "production"
        response.set_cookie(COOKIE_NAME, login.id, httponly=True, samesite="lax", secure=secure, max_age=14 * 86400)
        response.set_cookie(CSRF_COOKIE, login.csrf_token, httponly=False, samesite="lax", secure=secure, max_age=14 * 86400)
        return serialize_user(user)

    @app.post("/api/v1/auth/request-password-reset", status_code=202)
    def request_password_reset(payload: EmailIn, db: Session = Depends(db_session)) -> None:
        user = db.scalar(select(User).where(User.email == payload.email.lower()))
        if user:
            issue_token(db, user, "password-reset")
            db.commit()

    @app.post("/api/v1/auth/verify-email", status_code=204)
    def verify_email(payload: dict, db: Session = Depends(db_session)) -> Response:
        token_value = str(payload.get("token", ""))
        token = db.scalar(select(AuthToken).where(AuthToken.token == token_value, AuthToken.purpose == "verification").with_for_update())
        if not token or token.used_at or token.expires_at < datetime.now(UTC):
            raise HTTPException(400, "Invalid or expired verification token")
        user = db.get(User, token.user_id)
        if not user:
            raise HTTPException(400, "Invalid verification token")
        user.is_verified, token.used_at = True, datetime.now(UTC)
        db.commit()
        return Response(status_code=204)

    @app.post("/api/v1/auth/resend-verification", status_code=202)
    def resend_verification(db: Session = Depends(db_session), user: User = Depends(actor)) -> Response:
        if not user.is_verified:
            issue_token(db, user, "verification")
            db.commit()
        return Response(status_code=202)

    @app.post("/api/v1/auth/reset-password", status_code=204)
    def reset_password(payload: ResetPasswordIn, db: Session = Depends(db_session)) -> Response:
        token = db.scalar(select(AuthToken).where(AuthToken.token == payload.token, AuthToken.purpose == "password-reset").with_for_update())
        if not token or token.used_at or token.expires_at < datetime.now(UTC):
            raise HTTPException(400, "Invalid or expired reset token")
        user = db.get(User, token.user_id)
        if not user:
            raise HTTPException(400, "Invalid reset token")
        user.password_hash, token.used_at = PASSWORDS.hash(payload.password), datetime.now(UTC)
        for login in db.scalars(select(LoginSession).where(LoginSession.user_id == user.id)).all():
            db.delete(login)
        db.commit()
        return Response(status_code=204)

    @app.post("/api/v1/auth/logout", status_code=204)
    def logout(response: Response, db: Session = Depends(db_session), session_id: str | None = Cookie(default=None, alias=COOKIE_NAME)) -> Response:
        if session_id and (login := db.get(LoginSession, session_id)): db.delete(login); db.commit()
        response.delete_cookie(COOKIE_NAME); response.delete_cookie(CSRF_COOKIE); response.status_code = 204
        return response

    @app.get("/api/v1/me")
    def me(user: User = Depends(current_user)) -> dict: return serialize_user(user)

    @app.patch("/api/v1/me")
    def update_me(payload: ProfileIn, db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        for key, value in payload.model_dump(exclude_none=True).items():
            setattr(user, key, value.strip() if isinstance(value, str) else value)
        db.commit()
        return serialize_user(user)

    @app.post("/api/v1/skills", status_code=201)
    def add_skill(payload: SkillIn, db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        skill = get_skill(db, payload.name)
        existing = db.scalar(select(UserSkill).where(UserSkill.user_id == user.id, UserSkill.skill_id == skill.id))
        if existing: existing.level = payload.level
        else: db.add(UserSkill(user_id=user.id, skill_id=skill.id, level=payload.level))
        db.commit(); return {"id": skill.id, "name": skill.name, "level": payload.level}

    @app.get("/api/v1/me/skills")
    def my_skills(db: Session = Depends(db_session), user: User = Depends(current_user)) -> list[dict]:
        return [{"id": skill.id, "name": skill.name, "level": level} for skill, level in db.execute(select(Skill, UserSkill.level).join(UserSkill).where(UserSkill.user_id == user.id)).all()]

    @app.get("/api/v1/me/availability")
    def my_availability(db: Session = Depends(db_session), user: User = Depends(current_user)) -> dict:
        item = db.scalar(select(Availability).where(Availability.user_id == user.id))
        return {"hours_per_week": item.hours_per_week if item else 0, "note": item.note if item else ""}

    @app.put("/api/v1/me/availability")
    def set_availability(payload: dict, db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        hours = payload.get("hours_per_week")
        if not isinstance(hours, int) or not 0 <= hours <= 80: raise HTTPException(422, "hours_per_week must be between 0 and 80")
        item = db.scalar(select(Availability).where(Availability.user_id == user.id)) or Availability(user_id=user.id)
        item.hours_per_week, item.note = hours, str(payload.get("note", ""))[:300]
        db.add(item); db.commit(); return {"hours_per_week": item.hours_per_week, "note": item.note}

    @app.post("/api/v1/projects", status_code=201)
    def create_project(payload: ProjectIn, db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        project = Project(client_id=user.id, title=payload.title, description=payload.description, amount_minor=payload.amount_minor, currency=payload.currency.upper(), scale=payload.scale, estimated_hours=payload.estimated_hours)
        db.add(project); db.flush()
        for name in normalized_skill_names(payload.required_skills): db.add(ProjectSkill(project_id=project.id, skill_id=get_skill(db, name).id))
        db.commit(); return {"id": project.id, "title": project.title, "status": project.status, "required_skills": payload.required_skills}

    @app.get("/api/v1/projects")
    def list_projects(q: str = "", scale: str = "", db: Session = Depends(db_session)) -> list[dict]:
        stmt = select(Project).where(Project.status == "open")
        if q: stmt = stmt.where(Project.title.ilike(f"%{q.strip()}%"))
        if scale: stmt = stmt.where(Project.scale == scale)
        return [serialize_project(db, p) for p in db.scalars(stmt.order_by(Project.created_at.desc())).all()]

    @app.get("/api/v1/projects/{project_id}")
    def get_project(project_id: int, db: Session = Depends(db_session)) -> dict:
        project = db.get(Project, project_id)
        if not project:
            raise HTTPException(404, "Project not found")
        return serialize_project(db, project)

    @app.get("/api/v1/me/projects")
    def my_projects(db: Session = Depends(db_session), user: User = Depends(current_user)) -> list[dict]:
        projects = db.scalars(select(Project).where(Project.client_id == user.id).order_by(Project.created_at.desc())).all()
        result = []
        for project in projects:
            application_count = db.scalar(select(func.count()).select_from(Application).where(Application.project_id == project.id)) or 0
            order = db.scalar(select(Order).where(Order.project_id == project.id))
            result.append({**serialize_project(db, project), "application_count": application_count, "order_id": order.id if order else None})
        return result

    @app.put("/api/v1/projects/{project_id}")
    def update_project(project_id: int, payload: ProjectIn, db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        project = db.scalar(select(Project).where(Project.id == project_id).with_for_update())
        if not project: raise HTTPException(404, "Project not found")
        if project.client_id != user.id: raise HTTPException(403, "Only the project client may edit")
        if project.status != "open": raise HTTPException(409, "Only open projects may be edited")
        if db.scalar(select(Application.id).where(Application.project_id == project.id)):
            raise HTTPException(409, "A project with applications cannot be rewritten")
        project.title, project.description = payload.title, payload.description
        project.amount_minor, project.currency = payload.amount_minor, payload.currency.upper()
        project.scale, project.estimated_hours = payload.scale, payload.estimated_hours
        for link in db.scalars(select(ProjectSkill).where(ProjectSkill.project_id == project.id)).all(): db.delete(link)
        db.flush()
        for name in normalized_skill_names(payload.required_skills): db.add(ProjectSkill(project_id=project.id, skill_id=get_skill(db, name).id))
        db.commit()
        return serialize_project(db, project)

    @app.post("/api/v1/projects/{project_id}/close")
    def close_project(project_id: int, db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        project = db.scalar(select(Project).where(Project.id == project_id).with_for_update())
        if not project: raise HTTPException(404, "Project not found")
        if project.client_id != user.id: raise HTTPException(403, "Only the project client may close it")
        if project.status == "assigned": raise HTTPException(409, "Assigned projects cannot be closed")
        if project.status == "closed": return serialize_project(db, project)
        project.status = "closed"
        for application in db.scalars(select(Application).where(Application.project_id == project.id, Application.status == "pending").with_for_update()).all(): application.status = "closed"
        db.commit()
        return serialize_project(db, project)

    @app.get("/api/v1/projects/{project_id}/applications")
    def project_applications(project_id: int, db: Session = Depends(db_session), user: User = Depends(current_user)) -> list[dict]:
        project = db.get(Project, project_id)
        if not project:
            raise HTTPException(404, "Project not found")
        if project.client_id != user.id:
            raise HTTPException(403, "Only the project client may view applications")
        return [
            {"id": application.id, "project_id": application.project_id, "worker_id": application.worker_id, "status": application.status, "created_at": application.created_at, "worker": public_person(db, application.worker_id)}
            for application in db.scalars(select(Application).where(Application.project_id == project_id).order_by(Application.created_at)).all()
        ]

    @app.get("/api/v1/me/applications")
    def my_applications(db: Session = Depends(db_session), user: User = Depends(current_user)) -> list[dict]:
        applications = db.scalars(select(Application).where(Application.worker_id == user.id).order_by(Application.created_at.desc())).all()
        result = []
        for application in applications:
            project = db.get(Project, application.project_id)
            if not project:
                continue
            order = db.scalar(select(Order).where(Order.project_id == project.id, Order.worker_id == user.id)) if application.status == "accepted" else None
            result.append({"id": application.id, "status": application.status, "project": serialize_project(db, project), "order_id": order.id if order else None})
        return result

    @app.post("/api/v1/projects/{project_id}/applications", status_code=201)
    def apply(project_id: int, db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        project = db.scalar(select(Project).where(Project.id == project_id).with_for_update())
        if not project or project.status != "open": raise HTTPException(404, "Open project not found")
        if project.client_id == user.id: raise HTTPException(422, "You cannot apply to your own project")
        application = db.scalar(select(Application).where(Application.project_id == project.id, Application.worker_id == user.id).with_for_update())
        if application:
            if application.status == "withdrawn":
                application.status, application.created_at = "pending", datetime.now(UTC)
                db.commit()
                return {"id": application.id, "project_id": project.id, "status": application.status}
            raise HTTPException(409, "You already applied")
        try:
            application = Application(project_id=project.id, worker_id=user.id); db.add(application); db.commit()
        except IntegrityError:
            db.rollback(); raise HTTPException(409, "You already applied") from None
        return {"id": application.id, "project_id": project.id, "status": application.status}

    @app.post("/api/v1/applications/{application_id}/accept")
    def accept_application(application_id: int, db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        application = db.get(Application, application_id)
        if not application: raise HTTPException(404, "Application not found")
        project = db.scalar(select(Project).where(Project.id == application.project_id).with_for_update())
        if not project or project.client_id != user.id: raise HTTPException(403, "Only the project client may accept")
        application = db.scalar(select(Application).where(Application.id == application_id).execution_options(populate_existing=True).with_for_update())
        if not application: raise HTTPException(404, "Application not found")
        if project.status != "open" or application.status != "pending": raise HTTPException(409, "Project is no longer available")
        names = db.scalars(select(Skill.name).join(ProjectSkill).where(ProjectSkill.project_id == project.id)).all()
        order = Order(client_id=user.id, worker_id=application.worker_id, project_id=project.id, title=project.title, scope_snapshot=project.description, skills_snapshot=", ".join(names), amount_minor=project.amount_minor, fee_minor=project.amount_minor // 10, currency=project.currency, estimated_hours=project.estimated_hours, status="active")
        project.status, application.status = "assigned", "accepted"
        for other in db.scalars(select(Application).where(Application.project_id == project.id, Application.id != application.id, Application.status == "pending").with_for_update()).all():
            other.status = "not_selected"
        db.add(order); db.flush(); audit(db, order.id, user.id, "application_accepted"); db.commit()
        return serialize_order(order)

    @app.post("/api/v1/applications/{application_id}/withdraw")
    def withdraw_application(application_id: int, db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        initial = db.get(Application, application_id)
        if not initial: raise HTTPException(404, "Application not found")
        project = db.scalar(select(Project).where(Project.id == initial.project_id).with_for_update())
        application = db.scalar(select(Application).where(Application.id == application_id).execution_options(populate_existing=True).with_for_update())
        if not application: raise HTTPException(404, "Application not found")
        if application.worker_id != user.id: raise HTTPException(403, "Only the applicant may withdraw")
        if application.status == "accepted": raise HTTPException(409, "Accepted applications cannot be withdrawn")
        if application.status == "withdrawn": return {"id": application.id, "project_id": application.project_id, "status": application.status}
        if application.status != "pending": raise HTTPException(409, "This application cannot be withdrawn")
        application.status = "withdrawn"
        db.commit()
        return {"id": application.id, "project_id": application.project_id, "status": application.status}

    @app.post("/api/v1/services", status_code=201)
    def create_service(payload: ServiceIn, db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        service = Service(provider_id=user.id, title=payload.title, description=payload.description, amount_minor=payload.amount_minor, currency=payload.currency.upper(), estimated_hours=payload.estimated_hours)
        db.add(service); db.flush()
        for name in normalized_skill_names(payload.skills): db.add(ServiceSkill(service_id=service.id, skill_id=get_skill(db, name).id))
        db.commit(); return {"id": service.id, "title": service.title, "is_active": service.is_active}

    @app.get("/api/v1/services")
    def list_services(q: str = "", db: Session = Depends(db_session)) -> list[dict]:
        stmt = select(Service).where(Service.is_active.is_(True))
        if q: stmt = stmt.where(Service.title.ilike(f"%{q.strip()}%"))
        return [serialize_service(db, s) for s in db.scalars(stmt.order_by(Service.created_at.desc())).all()]

    @app.get("/api/v1/services/{service_id}")
    def get_service(service_id: int, db: Session = Depends(db_session)) -> dict:
        service = db.get(Service, service_id)
        if not service or not service.is_active:
            raise HTTPException(404, "Service not found")
        return serialize_service(db, service, detail=True)

    @app.get("/api/v1/me/services")
    def my_services(db: Session = Depends(db_session), user: User = Depends(current_user)) -> list[dict]:
        return [serialize_service(db, service, detail=True) for service in db.scalars(select(Service).where(Service.provider_id == user.id).order_by(Service.created_at.desc())).all()]

    @app.put("/api/v1/services/{service_id}")
    def update_service(service_id: int, payload: ServiceIn, db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        service = db.scalar(select(Service).where(Service.id == service_id).with_for_update())
        if not service: raise HTTPException(404, "Service not found")
        if service.provider_id != user.id: raise HTTPException(403, "Only the provider may edit this service")
        service.title, service.description = payload.title, payload.description
        service.amount_minor, service.currency, service.estimated_hours = payload.amount_minor, payload.currency.upper(), payload.estimated_hours
        for link in db.scalars(select(ServiceSkill).where(ServiceSkill.service_id == service.id)).all(): db.delete(link)
        db.flush()
        for name in normalized_skill_names(payload.skills): db.add(ServiceSkill(service_id=service.id, skill_id=get_skill(db, name).id))
        db.commit()
        return serialize_service(db, service, detail=True)

    @app.patch("/api/v1/services/{service_id}/visibility")
    def set_service_visibility(service_id: int, payload: VisibilityIn, db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        service = db.scalar(select(Service).where(Service.id == service_id).with_for_update())
        if not service: raise HTTPException(404, "Service not found")
        if service.provider_id != user.id: raise HTTPException(403, "Only the provider may change visibility")
        service.is_active = payload.is_active
        db.commit()
        return serialize_service(db, service, detail=True)

    @app.post("/api/v1/services/{service_id}/orders", status_code=201)
    def request_service(service_id: int, db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        service = db.scalar(select(Service).where(Service.id == service_id).with_for_update())
        if not service or not service.is_active: raise HTTPException(404, "Service not found")
        if service.provider_id == user.id: raise HTTPException(422, "You cannot order your own service")
        names = db.scalars(select(Skill.name).join(ServiceSkill).where(ServiceSkill.service_id == service.id)).all()
        order = Order(client_id=user.id, worker_id=service.provider_id, service_id=service.id, title=service.title, scope_snapshot=service.description, skills_snapshot=", ".join(names), amount_minor=service.amount_minor, fee_minor=service.amount_minor // 10, currency=service.currency, estimated_hours=service.estimated_hours)
        db.add(order); db.flush(); audit(db, order.id, user.id, "service_requested"); db.commit(); return serialize_order(order)

    @app.post("/api/v1/orders/{order_id}/accept")
    def accept_service_order(order_id: int, db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        order = db.scalar(select(Order).where(Order.id == order_id).with_for_update())
        if not order or order.worker_id != user.id: raise HTTPException(403, "Only the provider may accept")
        if order.status != "pending_acceptance": raise HTTPException(409, "Order cannot be accepted")
        order.status = "active"; audit(db, order.id, user.id, "service_order_accepted"); db.commit(); return serialize_order(order)

    @app.get("/api/v1/orders")
    def list_orders(db: Session = Depends(db_session), user: User = Depends(current_user)) -> list[dict]:
        orders = db.scalars(select(Order).where((Order.client_id == user.id) | (Order.worker_id == user.id)).order_by(Order.created_at.desc())).all()
        # ponytail: one latest-message lookup per visible order; batch a lateral query if order volume warrants it.
        return [serialize_order_summary(db, order) for order in orders]

    @app.get("/api/v1/orders/{order_id}")
    def get_order(order_id: int, db: Session = Depends(db_session), user: User = Depends(current_user)) -> dict: return serialize_order_detail(db, participant(db, order_id, user))

    @app.post("/api/v1/orders/{order_id}/cancel")
    def cancel_order(order_id: int, db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        order = participant(db, order_id, user, lock=True)
        if order.status not in {"pending_acceptance", "active", "submitted"}:
            raise HTTPException(409, "This order cannot be cancelled")
        order.status, order.payout_status = "cancelled", "blocked"
        audit(db, order.id, user.id, "order_cancelled")
        db.commit()
        return serialize_order(order)

    @app.post("/api/v1/orders/{order_id}/messages", status_code=201)
    def post_message(order_id: int, payload: MessageIn, db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        participant(db, order_id, user, lock=True); message = OrderMessage(order_id=order_id, author_id=user.id, body=payload.body); db.add(message); db.commit(); return {"id": message.id, "author_id": message.author_id, "body": message.body}

    @app.get("/api/v1/orders/{order_id}/messages")
    def get_messages(order_id: int, after_id: int = 0, db: Session = Depends(db_session), user: User = Depends(current_user)) -> list[dict]:
        participant(db, order_id, user)
        return [{"id": row.id, "author_id": row.author_id, "body": row.body, "created_at": row.created_at} for row in db.scalars(select(OrderMessage).where(OrderMessage.order_id == order_id, OrderMessage.id > after_id).order_by(OrderMessage.id)).all()]

    @app.post("/api/v1/orders/{order_id}/deliveries", status_code=201)
    def submit_delivery(order_id: int, payload: DeliveryIn, db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        order = participant(db, order_id, user, lock=True)
        if order.worker_id != user.id or order.status != "active": raise HTTPException(409, "Only the worker may deliver active work")
        delivery = Delivery(order_id=order.id, author_id=user.id, message=payload.message, submission_url=payload.submission_url); db.add(delivery); db.flush(); order.latest_delivery_id, order.status = delivery.id, "submitted"; audit(db, order.id, user.id, "delivery_submitted"); db.commit()
        return {"id": delivery.id, "order_id": delivery.order_id, "message": delivery.message, "submission_url": delivery.submission_url}

    @app.post("/api/v1/orders/{order_id}/request-revision")
    def request_revision(order_id: int, db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        order = participant(db, order_id, user, lock=True)
        if order.client_id != user.id or order.status != "submitted": raise HTTPException(409, "Only the client may request a revision after delivery")
        order.status = "active"; audit(db, order.id, user.id, "revision_requested"); db.commit(); return serialize_order(order)

    @app.post("/api/v1/orders/{order_id}/complete")
    def complete_order(order_id: int, payload: CompleteIn, db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        order = db.scalar(select(Order).where(Order.id == order_id).with_for_update())
        if not order or order.client_id != user.id: raise HTTPException(403, "Only the client may accept delivery")
        if order.status != "submitted": raise HTTPException(409, "Order is not ready to complete")
        delivery = db.get(Delivery, payload.delivery_id)
        if not delivery or delivery.order_id != order.id: raise HTTPException(422, "Delivery does not belong to this order")
        if payload.delivery_id != order.latest_delivery_id: raise HTTPException(422, "Accept the latest delivery")
        if db.scalar(select(Dispute).where(Dispute.order_id == order.id, Dispute.status == "open")): raise HTTPException(409, "Resolve the dispute before completing work")
        order.status, order.payout_status = "completed", "ready"; proof = ProofOfWork(order_id=order.id, worker_id=order.worker_id, title=order.title); db.add(proof); audit(db, order.id, user.id, "order_completed")
        try: db.commit()
        except IntegrityError:
            db.rollback(); raise HTTPException(409, "Order was already completed") from None
        return {**serialize_order(order), "proof_id": proof.id}

    @app.post("/api/v1/orders/{order_id}/reviews", status_code=201)
    def review_order(order_id: int, payload: ReviewIn, db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        order = participant(db, order_id, user, lock=True)
        if order.status != "completed": raise HTTPException(409, "Reviews require completed work")
        recipient = order.worker_id if user.id == order.client_id else order.client_id
        try: review = Review(order_id=order.id, author_id=user.id, recipient_id=recipient, rating=payload.rating, body=payload.body); db.add(review); db.commit()
        except IntegrityError:
            db.rollback(); raise HTTPException(409, "You already reviewed this order") from None
        return {"id": review.id, "rating": review.rating, "recipient_id": review.recipient_id}

    @app.get("/api/v1/me/proof")
    def my_proof(db: Session = Depends(db_session), user: User = Depends(current_user)) -> list[dict]:
        return [{"id": proof.id, "order_id": proof.order_id, "title": proof.title, "public": proof.public, "created_at": proof.created_at} for proof in db.scalars(select(ProofOfWork).where(ProofOfWork.worker_id == user.id).order_by(ProofOfWork.created_at.desc())).all()]

    @app.patch("/api/v1/me/proof/{proof_id}")
    def set_proof_visibility(proof_id: int, payload: ProofVisibilityIn, db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        proof = db.scalar(select(ProofOfWork).where(ProofOfWork.id == proof_id).with_for_update())
        if not proof: raise HTTPException(404, "Proof record not found")
        if proof.worker_id != user.id: raise HTTPException(403, "Only the worker may change proof visibility")
        proof.public = payload.public
        db.commit()
        return {"id": proof.id, "order_id": proof.order_id, "title": proof.title, "public": proof.public, "created_at": proof.created_at}

    @app.get("/api/v1/people/{user_id}")
    def public_profile(user_id: int, db: Session = Depends(db_session)) -> dict:
        member = db.get(User, user_id)
        if not member or not member.is_active: raise HTTPException(404, "Member not found")
        reviews = seller_reviews(db, user_id)
        services = [serialize_service(db, service) for service in db.scalars(select(Service).where(Service.provider_id == user_id, Service.is_active.is_(True)).order_by(Service.created_at.desc())).all()]
        proofs: list[dict] = []
        for proof in db.scalars(select(ProofOfWork).where(ProofOfWork.worker_id == user_id, ProofOfWork.public.is_(True)).order_by(ProofOfWork.created_at.desc())).all():
            order = db.get(Order, proof.order_id)
            skills = [item.strip() for item in order.skills_snapshot.split(",") if item.strip()] if order else []
            proofs.append({"id": proof.id, "title": proof.title, "skills": skills, "created_at": proof.created_at})
        return {**public_person(db, user_id), "services": services, "seller_rating": round(sum(item["rating"] for item in reviews) / len(reviews), 1) if reviews else None, "seller_review_count": len(reviews), "seller_reviews": reviews, "proofs": proofs}

    @app.post("/api/v1/orders/{order_id}/disputes", status_code=201)
    def report_dispute(order_id: int, payload: DisputeIn, db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        order = participant(db, order_id, user, lock=True)
        if order.status in {"completed", "cancelled"}: raise HTTPException(409, "This order cannot be disputed")
        dispute = Dispute(order_id=order.id, reporter_id=user.id, reason=payload.reason); db.add(dispute); audit(db, order.id, user.id, "dispute_opened"); db.commit(); return {"id": dispute.id, "status": dispute.status}

    @app.post("/api/v1/admin/disputes/{dispute_id}/resolve")
    def resolve_dispute(dispute_id: int, db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        if not user.is_admin: raise HTTPException(403, "Administrator access required")
        dispute = db.get(Dispute, dispute_id)
        if not dispute or dispute.status != "open": raise HTTPException(404, "Open dispute not found")
        dispute.status = "resolved"; audit(db, dispute.order_id, user.id, "dispute_resolved"); db.commit(); return {"id": dispute.id, "status": dispute.status}

    @app.get("/api/v1/admin/overview")
    def admin_overview(db: Session = Depends(db_session), user: User = Depends(current_user)) -> dict:
        if not user.is_admin:
            raise HTTPException(403, "Administrator access required")
        return {
            "users": [serialize_user(item) for item in db.scalars(select(User).order_by(User.created_at.desc()).limit(50)).all()],
            "projects": [{"id": item.id, "title": item.title, "status": item.status, "client_id": item.client_id} for item in db.scalars(select(Project).order_by(Project.created_at.desc()).limit(50)).all()],
            "disputes": [{"id": item.id, "order_id": item.order_id, "reason": item.reason, "status": item.status} for item in db.scalars(select(Dispute).order_by(Dispute.id.desc()).limit(50)).all()],
        }

    @app.post("/api/v1/payments/simulate/{order_id}")
    def simulate_payment(order_id: int, event_id: str, outcome: Literal["success", "failure", "refund", "payout"] = "success", db: Session = Depends(db_session), user: User = Depends(actor)) -> dict:
        if os.getenv("DEV_PAYMENT_SIMULATOR", "true").lower() != "true" or os.getenv("APP_ENV") == "production": raise HTTPException(404, "Payment simulator is unavailable")
        order = participant(db, order_id, user, lock=True)
        if order.client_id != user.id: raise HTTPException(403, "Only the client may simulate payment")
        existing = db.scalar(select(PaymentEvent).where(PaymentEvent.provider_event_id == event_id).with_for_update())
        if existing:
            if existing.order_id != order.id or existing.event_type != outcome:
                raise HTTPException(409, "Payment event was already used for another state")
            return {"duplicate": True, "payment_status": order.payment_status, "payout_status": order.payout_status}
        if outcome == "success":
            if order.payment_status not in {"unpaid", "failed", "paid"} or order.payout_status == "paid": raise HTTPException(409, "Payment cannot be funded in its current state")
            order.payment_status = "paid"
        elif outcome == "failure":
            if order.payment_status not in {"unpaid", "failed"}: raise HTTPException(409, "Payment cannot fail after settlement")
            order.payment_status = "failed"
        elif outcome == "refund":
            if order.payment_status != "paid" or order.payout_status == "paid": raise HTTPException(409, "Only a paid, unsettled payment can be refunded")
            order.payment_status, order.payout_status = "refunded", "blocked"
        elif outcome == "payout":
            if order.status != "completed" or order.payment_status != "paid" or order.payout_status != "ready" or db.scalar(select(Dispute).where(Dispute.order_id == order.id, Dispute.status == "open")):
                raise HTTPException(409, "Payout is not ready")
            order.payout_status = "paid"
        db.add(PaymentEvent(provider_event_id=event_id, order_id=order.id, event_type=outcome))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            event = db.scalar(select(PaymentEvent).where(PaymentEvent.provider_event_id == event_id))
            if event and event.order_id == order.id and event.event_type == outcome:
                return {"duplicate": True, "payment_status": order.payment_status, "payout_status": order.payout_status}
            raise HTTPException(409, "Payment event was already used for another state") from None
        return {"simulated": True, "payment_status": order.payment_status, "payout_status": order.payout_status}

    @app.get("/api/v1/matches")
    def matches(db: Session = Depends(db_session), user: User = Depends(current_user)) -> list[dict]:
        skill_ids = set(db.scalars(select(UserSkill.skill_id).where(UserSkill.user_id == user.id)).all())
        available = db.scalar(select(Availability.hours_per_week).where(Availability.user_id == user.id)) or 0
        results = []
        for project in db.scalars(select(Project).where(Project.status == "open")).all():
            required = set(db.scalars(select(ProjectSkill.skill_id).where(ProjectSkill.project_id == project.id)).all())
            score = len(required & skill_ids) * 20 + min(available, project.estimated_hours) * 2
            if project.client_id != user.id: results.append({"project_id": project.id, "title": project.title, "score": score, "why": f"{len(required & skill_ids)} matching skills and {available}h/week available"})
        return sorted(results, key=lambda item: item["score"], reverse=True)

    @app.get("/api/v1/dashboard")
    def dashboard(db: Session = Depends(db_session), user: User = Depends(current_user)) -> dict:
        orders = db.scalars(select(Order).where((Order.client_id == user.id) | (Order.worker_id == user.id))).all()
        proofs = db.scalar(select(func.count()).select_from(ProofOfWork).where(ProofOfWork.worker_id == user.id)) or 0
        earned = sum(o.amount_minor - o.fee_minor for o in orders if o.worker_id == user.id and o.status == "completed")
        ratings = db.scalars(select(Review.rating).where(Review.recipient_id == user.id)).all()
        return {"active_orders": sum(o.status in {"active", "submitted"} for o in orders), "earnings_minor": earned, "proof_count": proofs, "average_rating": round(sum(ratings) / len(ratings), 1) if ratings else None, "payment_label": "Simulated development payments"}

    @app.post("/api/v1/files", status_code=503)
    async def upload_file(file: UploadFile = File(...), _: User = Depends(actor)) -> dict:
        """Files remain quarantined until a configured malware scanner reports them safe."""
        _ = file
        raise HTTPException(503, "File scanning is not configured; submit a delivery link instead")

    return app


app = create_app()
