import React, { useEffect, useState } from "react";
import {
  MDBBadge,
  MDBTable,
  MDBTableHead,
  MDBTableBody,
  MDBContainer,
  MDBCard,
  MDBCardBody,
  MDBSpinner,
} from "mdb-react-ui-kit";
import { Link } from "react-router-dom";

const DEFAULT_PROFILE = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export default function Home() {
  const [topScores, setTopScores] = useState([]);
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        const [scoresRes, playersRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/leaderboard/top-scores"),
          fetch("http://127.0.0.1:8000/leaderboard/top-players"),
        ]);

        if (!scoresRes.ok || !playersRes.ok) {
          throw new Error("Failed to fetch leaderboard data");
        }

        const scores = await scoresRes.json();
        const players = await playersRes.json();

        setTopScores(scores);
        setTopPlayers(players);
      } catch (error) {
        console.error("Failed to fetch leaderboards:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboards();
  }, []);

  const crown = ["👑", "🥈", "🥉"];

  const getRowStyle = (index) => {
    if (index === 0) return { backgroundColor: "#fff8dc" }; // gold
    if (index === 1) return { backgroundColor: "#f0f8ff" }; // silver
    if (index === 2) return { backgroundColor: "#f5f5dc" }; // bronze
    return {};
  };

  if (loading) {
    return (
      <MDBContainer className="text-center py-5">
        <MDBSpinner grow color="primary" />
      </MDBContainer>
    );
  }

  return (
    <MDBContainer className="py-5">
      <MDBCard className="mb-5 shadow-3">
        <MDBCardBody>
          <h3 className="text-center mb-4">🏆 Top 10 Scores</h3>
          <MDBTable align="middle" hover>
            <MDBTableHead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Score</th>
              </tr>
            </MDBTableHead>
            <MDBTableBody>
              {topScores.map((user, index) => (
                <tr key={user.id} style={getRowStyle(index)}>
                  <td>{crown[index] || index + 1}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      <Link to={`/user/${user.id}`}>
                        {" "}
                        <img
                          src={
                            user.profile_picture
                              ? `${
                                  process.env.REACT_APP_API_URL ||
                                  "http://127.0.0.1:8000"
                                }${user.profile_picture}`
                              : DEFAULT_PROFILE
                          }
                          onError={(e) => (e.target.src = DEFAULT_PROFILE)}
                          alt="avatar"
                          style={{
                            width: "45px",
                            height: "45px",
                            objectFit: "cover",
                            borderRadius: "50%",
                          }}
                          className="rounded-circle"
                        />
                      </Link>
                      <div className="ms-3">
                        <Link to={`/user/${user.id}`}>
                          {" "}
                          <p className="fw-bold mb-1">{user.username}</p>
                        </Link>
                      </div>
                    </div>
                  </td>
                  <td>
                    <MDBBadge color="info" pill>
                      {user.best_score}
                    </MDBBadge>
                  </td>
                </tr>
              ))}
            </MDBTableBody>
          </MDBTable>
        </MDBCardBody>
      </MDBCard>

      <MDBCard className="shadow-3">
        <MDBCardBody>
          <h3 className="text-center mb-4">🏅 Top 5 Players</h3>
          <MDBTable align="middle" hover>
            <MDBTableHead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Best Score</th>
              </tr>
            </MDBTableHead>
            <MDBTableBody>
              {topPlayers.map((user, index) => (
                <tr key={user.id} style={getRowStyle(index)}>
                  <td>{crown[index] || index + 1}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      <Link to={`/user/${user.id}`}>
                        {" "}
                        <img
                          src={
                            user.profile_picture
                              ? `${
                                  process.env.REACT_APP_API_URL ||
                                  "http://127.0.0.1:8000"
                                }${user.profile_picture}`
                              : DEFAULT_PROFILE
                          }
                          onError={(e) => (e.target.src = DEFAULT_PROFILE)}
                          alt="avatar"
                          style={{
                            width: "45px",
                            height: "45px",
                            objectFit: "cover",
                            borderRadius: "50%",
                          }}
                          className="rounded-circle"
                        />
                      </Link>
                      <div className="ms-3">
                        <Link to={`/user/${user.id}`}>
                          {" "}
                          <p className="fw-bold mb-1">{user.username}</p>
                        </Link>
                      </div>
                    </div>
                  </td>
                  <td>
                    <MDBBadge color="dark" pill>
                      {user.best_score}
                    </MDBBadge>
                  </td>
                </tr>
              ))}
            </MDBTableBody>
          </MDBTable>
        </MDBCardBody>
      </MDBCard>
    </MDBContainer>
  );
}
