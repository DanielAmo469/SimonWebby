from fastapi import HTTPException, Depends, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from auth import get_current_user
from models import User
from database import get_db

def get_username_by_id(user_id: int, db: Session = Depends(get_db)) -> str:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.username

def get_profile_picture_binary(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.profile_picture:
        # Return null if no profile picture exists
        return JSONResponse(content=None, status_code=200)
    
    # Return the binary content of the profile picture if it exists
    return Response(content=user.profile_picture, media_type="image/jpeg")