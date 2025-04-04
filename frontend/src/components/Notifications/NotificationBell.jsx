import React, { useState, useEffect } from "react";
import { MDBBadge, MDBIcon } from "mdb-react-ui-kit";

const NotificationBell = () => {
  const [requestCount, setRequestCount] = useState(0);

  const fetchRequestCount = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/friend-requests/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setRequestCount(data.received_requests.length);
    } catch (error) {
      console.error("Error fetching request count:", error);
    }
  };

  useEffect(() => {
    fetchRequestCount();
  }, []);

  return (
    <div className="position-relative">
      <MDBIcon far icon="bell" size="lg" />
      {requestCount > 0 && (
        <MDBBadge
          pill
          color="danger"
          notification
          className="position-absolute top-0 start-100 translate-middle"
        >
          {requestCount}
        </MDBBadge>
      )}
    </div>
  );
};

export default NotificationBell;