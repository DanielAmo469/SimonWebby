import React, { useState, useEffect } from "react";
import {
  MDBContainer,
  MDBListGroup,
  MDBListGroupItem,
  MDBBtn,
} from "mdb-react-ui-kit";

const Notifications = () => {
  const [friendRequests, setFriendRequests] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        const response = await fetch("http://localhost:8000/friend-requests/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch friend requests");
        }
        const data = await response.json();
        setFriendRequests(data.received_requests);
      } catch (error) {
        console.error("Error fetching friend requests:", error);
      }
    };

    fetchFriendRequests();
  }, [token]);

  const handleAccept = async (requestId) => {
    try {
      const response = await fetch(
        `http://localhost:8000/friend-requests/${requestId}/accept`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        setFriendRequests((prev) =>
          prev.filter((request) => request.id !== requestId)
        );
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const handleDelete = async (requestId) => {
    try {
      const response = await fetch(
        `http://localhost:8000/friend-requests/${requestId}/delete`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        setFriendRequests((prev) =>
          prev.filter((request) => request.id !== requestId)
        );
      }
      window.location.reload();
    } catch (error) {
      console.error("Error deleting friend request:", error);
    }
  };

  return (
    <MDBContainer className="py-5">
      <h2>Friend Requsts</h2>

      <MDBListGroup>
        {friendRequests.length > 0 ? (
          friendRequests.map((request) => (
            <MDBListGroupItem
              key={request.id}
              className="d-flex justify-content-between align-items-center"
            >
              <div className="d-flex align-items-center gap-3">
                <img
                  src={request.requester_profile_picture ? `http://localhost:8000${request.requester_profile_picture}` : "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                  alt="avatar"
                  className="rounded-circle"
                  style={{ width: "45px", height: "45px", objectFit: "cover" }}
                  onError={(e) => { e.target.onerror = null; e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png"; }}
                />
                <div>
                  <a href={`/user/${request.requester_id}`} className="fw-bold text-dark text-decoration-none">
                    {request.requester_username}
                  </a>
                  <p className="text-muted mb-0" style={{ fontSize: "0.8rem" }}>
                    {new Date(request.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <MDBBtn
                  color="success"
                  size="sm"
                  onClick={() => handleAccept(request.id)}
                >
                  Accept
                </MDBBtn>
                <MDBBtn
                  color="danger"
                  size="sm"
                  className="ms-2"
                  onClick={() => handleDelete(request.id)}
                >
                  Delete
                </MDBBtn>
              </div>
            </MDBListGroupItem>
          ))
        ) : (
          <p>No friend requests at the moment.</p>
        )}
      </MDBListGroup>
    </MDBContainer>
  );
};

export default Notifications;