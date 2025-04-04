import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import PrivateRoute from "./components/PrivateRuote";
import Home from "./components/Home";
import Navbar from "./components/Navbar";
import Notifications from "./components/Notifications/Notifications";
import MyAccount from "./components/MyAccount";
import FriendPage from "./components/Friends";
import UserProfile from "./components/UserProfile";
import VolumeSettings from "./components/VolumeSettings";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    const fetchRequestCounts = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:8000/friend-requests/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch friend requests");
        }

        const data = await response.json();
        const { received_requests } = data;
        setRequestCount(received_requests ? received_requests.length : 0);
      } catch (error) {
        console.error("Error fetching request counts:", error);
      }
    };

    if (isLoggedIn) {
      fetchRequestCounts();
    }
  }, [isLoggedIn]);

  const handleLogin = (token) => {
    setIsLoggedIn(true);
    localStorage.setItem("token", token);
  };

  return (
    <Router>
      {isLoggedIn && <Navbar requestCount={requestCount} />}
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/home"
          element={
            <PrivateRoute isLoggedIn={isLoggedIn}>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <PrivateRoute isLoggedIn={isLoggedIn}>
              <Notifications />
            </PrivateRoute>
          }
        />
        <Route
          path="/my-account"
          element={
            <PrivateRoute isLoggedIn={isLoggedIn}>
              <MyAccount />
            </PrivateRoute>
          }
        />
                <Route
          path="/volume-settings"
          element={
            <PrivateRoute isLoggedIn={isLoggedIn}>
              <VolumeSettings />
            </PrivateRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <PrivateRoute isLoggedIn={isLoggedIn}>
              <FriendPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/user/:userId" // Added this route for user profile
          element={
            <PrivateRoute isLoggedIn={isLoggedIn}>
              <UserProfile />
            </PrivateRoute>
          }
        />
        <Route
          path="*"
          element={<Navigate to={isLoggedIn ? "/home" : "/login"} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
