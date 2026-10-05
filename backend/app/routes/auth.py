from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User, Profile, LearningProgress
from app.schemas.models import UserLogin, UserRegister, ProfileUpdate, ProfileResponse, AuthResponse
import hashlib

router = APIRouter(prefix="/auth", tags=["Authentication & Profile"])

def hash_pass(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/login", response_model=AuthResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or user.hashed_password != hash_pass(credentials.password):
        # Demo ease fallback
        if credentials.email == "alex@healthease.ai" or credentials.email == "demo@healthease.ai":
            user = db.query(User).first()
        else:
            raise HTTPException(status_code=401, detail="Invalid email or password")

    profile = user.profile
    if not profile:
        profile = Profile(user_id=user.id, full_name="Health Explorer")
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return AuthResponse(
        token=f"token_{user.id}",
        user_id=user.id,
        email=user.email,
        profile=ProfileResponse(
            id=profile.id,
            user_id=profile.user_id,
            full_name=profile.full_name,
            avatar_url=profile.avatar_url,
            preferred_language=profile.preferred_language,
            explanation_level=profile.explanation_level,
            voice_speed=profile.voice_speed,
            voice_gender=profile.voice_gender,
            high_contrast=profile.high_contrast,
            reduced_motion=profile.reduced_motion
        )
    )

@router.post("/register", response_model=AuthResponse)
def register(data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already registered with this email")

    user = User(email=data.email, hashed_password=hash_pass(data.password))
    db.add(user)
    db.flush()

    profile = Profile(user_id=user.id, full_name=data.full_name)
    db.add(profile)

    progress = LearningProgress(user_id=user.id)
    db.add(progress)

    db.commit()
    db.refresh(profile)

    return AuthResponse(
        token=f"token_{user.id}",
        user_id=user.id,
        email=user.email,
        profile=ProfileResponse(
            id=profile.id,
            user_id=profile.user_id,
            full_name=profile.full_name,
            avatar_url=profile.avatar_url,
            preferred_language=profile.preferred_language,
            explanation_level=profile.explanation_level,
            voice_speed=profile.voice_speed,
            voice_gender=profile.voice_gender,
            high_contrast=profile.high_contrast,
            reduced_motion=profile.reduced_motion
        )
    )

@router.get("/profile", response_model=ProfileResponse)
def get_current_profile(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user or not user.profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    p = user.profile
    return ProfileResponse(
        id=p.id,
        user_id=p.user_id,
        full_name=p.full_name,
        avatar_url=p.avatar_url,
        preferred_language=p.preferred_language,
        explanation_level=p.explanation_level,
        voice_speed=p.voice_speed,
        voice_gender=p.voice_gender,
        high_contrast=p.high_contrast,
        reduced_motion=p.reduced_motion
    )

@router.put("/profile", response_model=ProfileResponse)
def update_profile(updates: ProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user or not user.profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    p = user.profile

    if updates.full_name is not None:
        p.full_name = updates.full_name
    if updates.avatar_url is not None:
        p.avatar_url = updates.avatar_url
    if updates.preferred_language is not None:
        p.preferred_language = updates.preferred_language
    if updates.explanation_level is not None:
        p.explanation_level = updates.explanation_level
    if updates.voice_speed is not None:
        p.voice_speed = updates.voice_speed
    if updates.voice_gender is not None:
        p.voice_gender = updates.voice_gender
    if updates.high_contrast is not None:
        p.high_contrast = updates.high_contrast
    if updates.reduced_motion is not None:
        p.reduced_motion = updates.reduced_motion

    db.commit()
    db.refresh(p)

    return ProfileResponse(
        id=p.id,
        user_id=p.user_id,
        full_name=p.full_name,
        avatar_url=p.avatar_url,
        preferred_language=p.preferred_language,
        explanation_level=p.explanation_level,
        voice_speed=p.voice_speed,
        voice_gender=p.voice_gender,
        high_contrast=p.high_contrast,
        reduced_motion=p.reduced_motion
    )
