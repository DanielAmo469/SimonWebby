import React, { useEffect, useState, useCallback } from "react";
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBCardImage,
  MDBCardText,
  MDBCardTitle,
  MDBTypography,
  MDBListGroup,
  MDBListGroupItem,
  MDBBtn,
} from "mdb-react-ui-kit";
import { useNavigate } from "react-router-dom";

const DEFAULT_PROFILE = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

const MyAccount = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserInfo = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found, redirecting to login...");
      }

      const response = await fetch("http://localhost:8000/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Unauthorized access, redirecting to login...");
          localStorage.removeItem("token");
          navigate("/login");
        }
        throw new Error("Failed to fetch user information");
      }

      const data = await response.json();
      setUserInfo(data);
    } catch (error) {
      console.error("Error fetching user information:", error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  if (loading) {
    return (
      <MDBContainer className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <MDBTypography tag="h3">Loading...</MDBTypography>
      </MDBContainer>
    );
  }

  if (!userInfo) {
    return (
      <MDBContainer className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <MDBTypography tag="h3" color="danger">
          Failed to load user information.
        </MDBTypography>
      </MDBContainer>
    );
  }

  const { username, email, best_score, profile_picture, friends, scores } = userInfo;

  return (
    <MDBContainer className="py-5">
      <MDBRow>
        <MDBCol md="4">
          <MDBCard>
            <MDBCardBody className="text-center">
              <MDBCardImage
                src={
                  profile_picture
                    ? `http://localhost:8000${profile_picture}`
                    : DEFAULT_PROFILE
                }
                alt="Profile Picture"
                className="rounded-circle mb-3"
                style={{ width: "150px", height: "150px", objectFit: "cover" }}
              />
              <MDBCardTitle>{username}</MDBCardTitle>
              <MDBCardText>{email}</MDBCardText>
              <MDBCardText>
                <strong>Best Score:</strong> {best_score || "N/A"}
              </MDBCardText>
              <div className="d-flex justify-content-center mt-3">
                <MDBBtn
                  rounded
                  color="success"
                  size="sm"
                  onClick={() => document.getElementById("uploadInput").click()}
                >
                  Add/Change Profile Picture
                </MDBBtn>
                <MDBBtn
                  rounded
                  className="mx-2"
                  color="danger"
                  size="sm"
                  onClick={async () => {
                    const token = localStorage.getItem("token");
                    const response = await fetch("http://localhost:8000/users/delete-profile-picture", {
                      method: "DELETE",
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    });

                    if (response.ok) {
                      fetchUserInfo(); // refresh profile info
                    } else {
                      console.error("Failed to delete profile picture");
                    }
                  }}
                >
                  Remove Profile Picture
                </MDBBtn>
              </div>
              <input
                id="uploadInput"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  const formData = new FormData();
                  formData.append("file", file);

                  const token = localStorage.getItem("token");
                  const response = await fetch("http://localhost:8000/users/upload-profile-picture", {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                  });

                  if (response.ok) {
                    fetchUserInfo(); // refresh profile info
                  } else {
                    console.error("Failed to upload profile picture");
                  }
                }}
                style={{ display: "none" }}
              />
            </MDBCardBody>
          </MDBCard>
        </MDBCol>
        <MDBCol md="8">
          <MDBCard className="mb-4">
            <MDBCardBody>
              <MDBTypography tag="h4">Friends</MDBTypography>
              {friends && friends.length > 0 ? (
                <MDBListGroup>
                  {friends.map((friend) => (
                    <MDBListGroupItem key={friend.id} className="d-flex align-items-center">
                      <MDBCardImage
                        src={
                          friend.profile_picture
                            ? `http://localhost:8000/users/${friend.id}/profile-picture/`
                            : "https://via.placeholder.com/50"
                        }
                        alt="Friend's Profile Picture"
                        className="rounded-circle"
                        style={{ width: "50px", height: "50px", objectFit: "cover", marginRight: "15px" }}
                      />
                      {friend.username}
                    </MDBListGroupItem>
                  ))}
                </MDBListGroup>
              ) : (
                <MDBTypography tag="p" className="text-muted">
                  You don't have any friends yet.
                </MDBTypography>
              )}
            </MDBCardBody>
          </MDBCard>
          <MDBCard>
            <MDBCardBody>
              <MDBTypography tag="h4">Scores</MDBTypography>
              {scores && scores.length > 0 ? (
                <MDBListGroup>
                  {scores.map((score, index) => (
                    <MDBListGroupItem key={index} className="d-flex justify-content-between">
                      <span>{score.score}</span>
                      <span>{new Date(score.timestamp).toLocaleString()}</span>
                    </MDBListGroupItem>
                  ))}
                </MDBListGroup>
              ) : (
                <MDBTypography tag="p" className="text-muted">
                  No scores available.
                </MDBTypography>
              )}
            </MDBCardBody>
          </MDBCard>
        </MDBCol>
      </MDBRow>
    </MDBContainer>
  );
};

export default MyAccount;