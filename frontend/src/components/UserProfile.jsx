import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const DEFAULT_PROFILE = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const UserProfile = () => {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const numericId = parseInt(userId);
      if (isNaN(numericId)) {
        console.error("Invalid userId:", userId);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:8000/user/${numericId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUserData(response.data);
        setIsFriend(response.data.is_friend); // backend includes this field
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (error.response) {
          console.log("Response data: ", error.response.data);
        }
        setError("Failed to load user data");
      }
    };

    fetchUserData();
  }, [userId]);

  const handleSendFriendRequest = async (friendId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(
        `http://localhost:8000/friend-request/`,
        { receiver_id: friendId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response.data.message);
      setFriendRequestSent(true); // ✅ show message
    } catch (error) {
      console.error("Error sending friend request", error);
      if (error.response) {
        console.log("Backend said:", error.response.data);
      }
    }
  };

  const handleUnfriend = async (friendId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.delete(
        `http://localhost:8000/unfriend/${friendId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response.data.detail);
      setIsFriend(false); // update UI
    } catch (error) {
      console.error("Error unfriending user", error);
    }
  };

  return (
    <div className="container mt-4">
      {error && <p className="text-danger">{error}</p>}
      {userData && (
        <div className="row">
          {/* Profile Section */}
          <div className="col-md-4">
            <div className="card text-center shadow-sm">
              <div className="card-body">
                <img
                  src={
                    userData.profile_picture
                      ? `http://localhost:8000${userData.profile_picture}`
                      : DEFAULT_PROFILE
                  }
                  alt="Profile"
                  className="rounded-circle mb-3"
                  style={{
                    width: "150px",
                    height: "150px",
                    objectFit: "cover",
                  }}
                />
                <h3>{userData.username}</h3>
                <p className="text-muted">{userData.email}</p>
                <p>
                  <strong>Best Score:</strong> {userData.best_score}
                </p>

                {isFriend ? (
                  <button
                    className="btn btn-danger"
                    onClick={() => handleUnfriend(userData.id)}
                  >
                    Unfriend
                  </button>
                ) : friendRequestSent ? (
                  <p className="text-success fw-bold">Friend request sent!</p>
                ) : (
                  <button
                    className="btn btn-success"
                    onClick={() => handleSendFriendRequest(userData.id)}
                  >
                    Send Friend Request
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Friends and Scores Section */}
          <div className="col-md-8">
            <div className="card mb-4 shadow-sm">
              <div className="card-body">
                <h4 className="card-title">Friends</h4>
                {userData.friends.length > 0 ? (
                  <ul className="list-unstyled">
                    {userData.friends.map((friend) => (
                      <li
                        key={friend.id}
                        className="d-flex align-items-center mb-2"
                      >
                        <a
                          href={`/user/${friend.id}`}
                          className="d-flex align-items-center text-decoration-none text-dark"
                        >
                          <img
                            src={
                              friend.profile_picture
                                ? `http://localhost:8000${friend.profile_picture}`
                                : DEFAULT_PROFILE
                            }
                            alt={friend.username}
                            className="rounded-circle me-2"
                            style={{
                              width: "40px",
                              height: "40px",
                              objectFit: "cover",
                            }}
                          />
                          <a href={`/user/${friend.id}`} className="text-decoration-none text-dark">
                            {friend.username}
                          </a>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">No friends yet</p>
                )}
              </div>
            </div>

            <div className="card shadow-sm">
              <div className="card-body">
                <h4 className="card-title">Scores</h4>
                {userData.scores.length > 0 ? (
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Score</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userData.scores.map((score, index) => (
                        <tr key={index}>
                          <td>{score.score}</td>
                          <td>{new Date(score.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-muted">No scores yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
