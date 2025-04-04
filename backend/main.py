from datetime import timedelta
import uvicorn

from typing import List
from fastapi.responses import JSONResponse
from passlib.hash import bcrypt
from fastapi import Body, Depends, FastAPI, File, HTTPException, Request, Response, UploadFile
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm 
from fastapi.middleware.cors import CORSMiddleware
import requests


from schemas import BaseResponse, Data, FriendRequestCreate, FriendRequestPayload, FriendRequestResponse, FriendRequests, LeaderboardUser, ScoreData, UserCreate, UserValues
from database import Base, SessionLocal, engine, get_db
from auth import create_access_token, get_current_user
from models import FriendRequestStatus, User, FriendRequest, Score, Sound, SoundSetting
from database import Base, engine
from services import get_profile_picture_binary, get_username_by_id

Base.metadata.create_all(bind=engine)


app = FastAPI()

ESP32_IP = "http://172.20.10.13:8000/esp-login"




# User registration endpoint
@app.post("/register", response_model=BaseResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Validate the password strength
    if not user.is_valid_password:
        raise HTTPException(
            status_code=422,
            detail="Password must be at least 8 characters and contain at least one uppercase letter."
        )

    # Ensure password and verify_password are identical
    if user.password != user.verify_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    # Check if the email is already registered
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered.")

    # Check if the username is already taken
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already taken.")

    # Hash the password and create a new user
    hashed_password = bcrypt.hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
    )
    db.add(new_user)  # Add the new user to the session
    db.commit()  # Commit the transaction to persist the changes
    db.refresh(new_user)  # Refresh to get the newly assigned ID

    return {"message": "User created successfully", "user_id": new_user.id}


# User login endpoint
@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Validate the user's credentials
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not bcrypt.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Create the JWT token
    token = create_access_token(
        sub=user.username,
        user_id=user.id,
        expires_delta=timedelta(minutes=60),
    )

    # ✅ Send login data to ESP32
    data = {"user_id": user.id, "username": user.username}
    try:
        response = requests.post(ESP32_IP, json=data, timeout=10)  
        print(f"Sent login data to ESP: {response.text}")  
    except requests.exceptions.RequestException as e:
        print(f"⚠️ Failed to send login data to ESP: {e}")


    return {"access_token": token, "token_type": "bearer"}


@app.post("/users/upload-profile-picture/")
def upload_profile_picture_binary(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Read binary content of the file
    file_content = file.file.read()
    user.profile_picture = file_content
    db.commit()
    return {"message": "Profile picture saved in the database"}


@app.delete("/users/delete-profile-picture/")
def delete_profile_picture(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.profile_picture = None
    db.commit()
    return {"message": "Profile picture deleted successfully"}

@app.get("/users/{user_id}/profile-picture/")
def get_profile_picture(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.profile_picture:
        raise HTTPException(status_code=404, detail="Profile picture not found")
    return Response(content=user.profile_picture, media_type="image/jpeg")


@app.get("/me", response_model=UserValues)
def get_user_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Query the current user
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate the profile picture URL or return None if not available
    profile_picture_url = None
    if user.profile_picture:
        profile_picture_url = f"/users/{user.id}/profile-picture/"

    # Fetch friends using the get_all_friends logic
    friends = db.query(FriendRequest).filter(
        ((FriendRequest.requester_id == current_user.id) & (FriendRequest.status == FriendRequestStatus.accepted)) |
        ((FriendRequest.receiver_id == current_user.id) & (FriendRequest.status == FriendRequestStatus.accepted))
    ).all()

    # Collect friend IDs and fetch their details
    friend_ids = [
        friend.receiver_id if friend.requester_id == current_user.id else friend.requester_id
        for friend in friends
    ]
    if not friend_ids:
        friend_users = []
    else:
        friend_users = db.query(User).filter(User.id.in_(friend_ids)).all()

    # Construct the friends data, including the best_score for each friend
    friends_data = [
        {
            "id": friend.id,
            "username": friend.username,
            "profile_picture": f"/users/{friend.id}/profile-picture/" if friend.profile_picture else None,
            "best_score": friend.best_score,  # Include best_score here
        }
        for friend in friend_users
    ]

    # Return the user data
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "best_score": user.best_score,
        "profile_picture": profile_picture_url,
        "friends": friends_data,  # Include friends with best_score
        "sound_settings": user.sound_settings,
        "scores": [
            {"score": score.score, "timestamp": score.timestamp}
            for score in user.scores
        ],
    }


@app.post("/friend-request/")
def send_friend_request(
    payload: FriendRequestPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    receiver_id = payload.receiver_id
    receiver = db.query(User).filter(User.id == receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="User not found")

    existing_request = db.query(FriendRequest).filter(
        FriendRequest.requester_id == current_user.id,
        FriendRequest.receiver_id == receiver_id
    ).first()
    if existing_request:
        raise HTTPException(status_code=400, detail="Friend request already sent")

    friend_request = FriendRequest(
        requester_id=current_user.id,
        receiver_id=receiver_id,
        status=FriendRequestStatus.pending
    )
    db.add(friend_request)
    db.commit()
    return {"message": "Friend request sent successfully"}


# Add friend by username

@app.post("/friend-request-by-username/")
def send_friend_request_by_username(
    username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    # Query the receiver by username
    receiver = db.query(User).filter(User.username == username).first()

    # If the user is not found, return a custom message with status 200 (OK)
    if not receiver:
        return JSONResponse(status_code=200, content={"message": f"User with username '{username}' not found."})

    # If user is found, proceed with sending the friend request
    return send_friend_request(receiver.id, db=db, current_user=current_user)

# Approve friend request
@app.post("/friend-requests/{request_id}/accept")
def accept_friend_request(
    request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    # Retrieve the friend request
    friend_request = db.query(FriendRequest).filter(FriendRequest.id == request_id).first()

    if not friend_request:
        raise HTTPException(status_code=404, detail="Friend request not found")

    # Check if the current user is the receiver of the request
    if friend_request.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to accept this request")

    # Update the status to 'accepted'
    friend_request.status = "accepted"
    db.commit()
    db.refresh(friend_request)

    return {"message": "Friend request accepted"}

# Deny friend request
@app.delete("/friend-request/{request_id}/deny/")
def deny_friend_request(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    friend_request = db.query(FriendRequest).filter(
        FriendRequest.id == request_id,
        FriendRequest.receiver_id == current_user.id
    ).first()
    if not friend_request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    db.delete(friend_request)
    db.commit()
    return {"message": "Friend request denied"}

# View all friend requests
@app.get("/friend-requests/", response_model=FriendRequests)
def get_friend_requests(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    # Get sent requests with 'pending' status
    sent_requests = (
        db.query(FriendRequest)
        .join(User, FriendRequest.receiver_id == User.id)  # Join with receiver's user table
        .filter(FriendRequest.requester_id == current_user.id)
        .filter(FriendRequest.status == FriendRequestStatus.pending)  # Only pending requests
        .all()
    )

    # Get received requests with 'pending' status
    received_requests = (
        db.query(FriendRequest)
        .join(User, FriendRequest.requester_id == User.id)  # Join with requester's user table
        .filter(FriendRequest.receiver_id == current_user.id)
        .filter(FriendRequest.status == FriendRequestStatus.pending)  # Only pending requests
        .all()
    )

    # Map sent_requests and received_requests to include usernames and profile pictures
    def map_requests(requests, include_requester_username):
        return [
            FriendRequestResponse(
                id=req.id,
                requester_id=req.requester_id,
                requester_username=req.requester.username if include_requester_username else current_user.username,
                requester_profile_picture=f"/users/{req.requester_id}/profile-picture/" if req.requester.profile_picture else None,
                receiver_id=req.receiver_id,
                receiver_profile_picture=f"/users/{req.receiver_id}/profile-picture/" if req.receiver.profile_picture else None,
                status=req.status.name,
                timestamp=req.timestamp,
            )
            for req in requests
        ]

    return {
        "sent_requests": map_requests(sent_requests, include_requester_username=False),
        "received_requests": map_requests(received_requests, include_requester_username=True),
    }

@app.get("/user/{user_id}", response_model=UserValues)
def get_user_profile(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Debugging: Print the user_id and current_user_id
    print(f"Requesting profile for user ID: {user_id}, current user ID: {current_user.id}")
    
    # Query the specified user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        print(f"User not found with ID: {user_id}")  # Log if user is not found
        raise HTTPException(status_code=404, detail="User not found")

    # Generate profile picture URL or return None if not available
    profile_picture_url = f"/users/{user.id}/profile-picture/" if user.profile_picture else None

    # Fetch friends
    friends = db.query(FriendRequest).filter(
        ((FriendRequest.requester_id == user.id) & (FriendRequest.status == FriendRequestStatus.accepted)) |
        ((FriendRequest.receiver_id == user.id) & (FriendRequest.status == FriendRequestStatus.accepted))
    ).all()

    friend_ids = [
        friend.receiver_id if friend.requester_id == user.id else friend.requester_id
        for friend in friends
    ]
    
    friend_users = db.query(User).filter(User.id.in_(friend_ids)).all()

    # Construct the friends data
    friends_data = [
        {
            "id": friend.id,
            "username": friend.username,
            "profile_picture": f"/users/{friend.id}/profile-picture/" if friend.profile_picture else None,
            "best_score": friend.best_score,  # Include best_score here
        }
        for friend in friend_users
    ]

    # Check if the logged-in user is already friends with the user
    is_friend = any(friend.id == current_user.id for friend in friend_users)

    # Fetch scores for the user
    scores = db.query(Score).filter(Score.user_id == user.id).all()

    # Return user data
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "best_score": user.best_score,
        "profile_picture": profile_picture_url,
        "friends": friends_data,
        "is_friend": is_friend,
        "scores": [
            {"score": score.score, "timestamp": score.timestamp}
            for score in scores
        ],
    }

@app.get("/friends/")
def get_all_friends(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    friends = db.query(FriendRequest).filter(
        ((FriendRequest.requester_id == current_user.id) & (FriendRequest.status == FriendRequestStatus.accepted)) |
        ((FriendRequest.receiver_id == current_user.id) & (FriendRequest.status == FriendRequestStatus.accepted))
    ).all()

    friend_ids = []
    for friend in friends:
        if friend.requester_id == current_user.id:
            friend_ids.append(friend.receiver_id)
        elif friend.receiver_id == current_user.id:
            friend_ids.append(friend.requester_id)

    friend_users = db.query(User).filter(User.id.in_(friend_ids)).all()

    friends_data = [
        {
            "id": friend.id,
            "username": friend.username,
            "email": friend.email,
            "profile_picture": None if not friend.profile_picture else friend.profile_picture.decode('utf-8'),
        }
        for friend in friend_users
    ]

    return JSONResponse(content={"friends": friends_data})

@app.delete("/unfriend/{friend_id}/")
def unfriend_user(friend_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    # Find the accepted friendship in FriendRequest table
    friendship = db.query(FriendRequest).filter(
        ((FriendRequest.requester_id == current_user.id) & (FriendRequest.receiver_id == friend_id) & (FriendRequest.status == FriendRequestStatus.accepted)) |
        ((FriendRequest.requester_id == friend_id) & (FriendRequest.receiver_id == current_user.id) & (FriendRequest.status == FriendRequestStatus.accepted))
    ).first()

    if not friendship:
        raise HTTPException(status_code=404, detail="Friendship not found")

    # Delete the accepted friendship request
    db.delete(friendship)
    db.commit()

    return {"detail": f"Successfully unfriended user with ID {friend_id}"}

@app.get("/leaderboard/top-scores", response_model=List[LeaderboardUser])
def get_top_scores(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.best_score.desc()).limit(10).all()
    return [
        LeaderboardUser(
            id=user.id,
            username=user.username,
            best_score=user.best_score,
            profile_picture=f"/users/{user.id}/profile-picture/" if user.profile_picture else None
        )
        for user in users
    ]

@app.get("/leaderboard/top-players", response_model=List[LeaderboardUser])
def get_top_players(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.best_score.desc()).limit(5).all()
    return [
        LeaderboardUser(
            id=user.id,
            username=user.username,
            best_score=user.best_score,
            profile_picture=f"/users/{user.id}/profile-picture/" if user.profile_picture else None
        )
        for user in users
    ]

@app.post("/submit-score")
def submit_score(data: ScoreData, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_score = Score(user_id=data.user_id, score=data.score)
    db.add(new_score)

    if data.score > user.best_score:
        user.best_score = data.score

    db.commit()
    return {"status": "score recorded"}

@app.post("/esp-data")
async def receive_data(request: Request):
    raw_data = await request.body()
    print(f"Raw request body: {raw_data.decode('utf-8')}")
    return {"status": "success"}

@app.post("/send-login")
async def send_login_data(user_id: int, username: str):
    data = {"user_id": user_id, "username": username}
    
    try:
        response = requests.post(ESP32_IP, json=data, timeout=5)
        return {"status": "success", "esp_response": response.text}
    except requests.exceptions.RequestException as e:
        return {"status": "failed", "error": str(e)}
    
@app.post("/set-volume/")
def set_volume(volume: int = Body(..., embed=True)):
    import requests

    esp32_ip = "http://172.20.10.13:8000/set-volume"
    try:
        response = requests.post(esp32_ip, json={"volume": volume})
        response.raise_for_status()
        return {"message": f"Volume set to {volume}"}
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to send volume to ESP32: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
