import React, { useState, useEffect } from 'react';
import { MDBRange, MDBBtn } from 'mdb-react-ui-kit';
import axios from 'axios';

export default function VolumeSettings() {
  const [volume, setVolume] = useState(15);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    try {
      const response = await axios.post('http://localhost:8000/set-volume/', {
        volume: volume,
      });
  
      if (response.status === 200) {
        setMessage(response.data.message || "Volume set!");
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setMessage("Unexpected response from server.");
      }
    } catch (error) {
      console.error("Error setting volume:", error);
      if (error.response && error.response.data && error.response.data.detail) {
        setMessage("Error: " + error.response.data.detail);
      } else {
        setMessage("Failed to set volume.");
      }
      setSuccess(false);  // 👈 ensure green message is not shown
    }
  };

  return (
    <div className="container mt-4">
      <h2>Adjust ESP32 Game Volume</h2>
      <p>
        1. Log in with your account. <br />
        2. Start the game using the Simon ESP32 device. <br />
        3. When prompted <strong>“Do you want to change volume?”</strong>, press the <strong>yellow button</strong> to select YES. <br />
        4. Then return here to select your preferred volume and submit it.
      </p>

      <div className="my-4">
        <label htmlFor="customRange" className="form-label fw-bold">Select Volume: {volume}</label>
        <MDBRange
          value={volume}
          id="customRange"
          min={0}
          max={30}
          step={1}
          onChange={(e) => setVolume(parseInt(e.target.value))}
        />
      </div>

      {success ? (
        <MDBBtn disabled size="lg" color="success">
          ✅ Volume Set!
        </MDBBtn>
      ) : (
        <MDBBtn onClick={handleSubmit} size="lg">
          Submit Volume
        </MDBBtn>
      )}

      {message && <p className="mt-3 fw-bold">{message}</p>}
    </div>
  );
}