import React, { useEffect, useState } from 'react';
import {
  MDBTabs, MDBTabsItem, MDBTabsLink,
  MDBTabsContent, MDBTabsPane,
  MDBCard, MDBCardBody, MDBInput, MDBBtn, MDBIcon
} from 'mdb-react-ui-kit';
import axios from 'axios';

const DEFAULT_PROFILE = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export default function Friends() {
    const [activeTab, setActiveTab] = useState('friends');
    const [userData, setUserData] = useState({ friends: [] });
    const [newFriendUsername, setNewFriendUsername] = useState('');
    const [requestStatus, setRequestStatus] = useState('');
  
    const toggleTab = (tab) => {
      if (tab !== activeTab) setActiveTab(tab);
    };
  
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("Fetched user data:", response.data);  // Check the response structure
        setUserData({ friends: response.data.friends || [] });
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
  
    const handleAddFriend = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/friend-request-by-username/`,
          null,
          {
            params: { username: newFriendUsername },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
    
        // Check for the message returned by the backend and display it
        if (response.data.message) {
          setRequestStatus(response.data.message);  // Show the custom message
        } else {
          setRequestStatus('Friend request sent!');
        }
      } catch (error) {
        console.error('Error sending friend request:', error);
        setRequestStatus('Failed to send request.');
      }
    };
  
    useEffect(() => {
      fetchUserData();
    }, []);
  
    return (
      <>
        <MDBTabs className='mb-3'>
          <MDBTabsItem>
            <MDBTabsLink onClick={() => toggleTab('friends')} active={activeTab === 'friends'}>
              My Friends
            </MDBTabsLink>
          </MDBTabsItem>
          <MDBTabsItem>
            <MDBTabsLink onClick={() => toggleTab('add')} active={activeTab === 'add'}>
              Add Friend
            </MDBTabsLink>
          </MDBTabsItem>
        </MDBTabs>
  
        <MDBTabsContent>
          <MDBTabsPane open={activeTab === 'friends'}>
            {userData?.friends?.length === 0 ? (
                <p className="text-muted">You have no friends yet.</p>
            ) : (
                <div className="d-flex flex-wrap gap-3">
                    {userData.friends.map((friend) => (
                        <MDBCard key={friend.id} style={{ width: '18rem' }} className="shadow-3">
                            <MDBCardBody className="text-center">
                                <img
                                    src={friend.profile_picture ? `${process.env.REACT_APP_API_URL}${friend.profile_picture}` : DEFAULT_PROFILE}
                                    onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_PROFILE; }}
                                    className="rounded-circle mb-3"
                                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                    alt="avatar"
                                />
                                <h5 className="mb-1">
                                  <a href={`/user/${friend.id}`} className="text-decoration-none text-dark">
                                    {friend.username}
                                  </a>
                                </h5>
                                <p className="text-muted small">{friend.email}</p>
                                <p className="text-muted small">Best Score: {friend.best_score}</p> {/* Display best score */}
                            </MDBCardBody>
                        </MDBCard>
                    ))}
                </div>
            )}
          </MDBTabsPane>
  
          <MDBTabsPane open={activeTab === 'add'}>
            <MDBCard className="shadow-3">
              <MDBCardBody>
                <MDBInput
                  label="Friend's Username"
                  value={newFriendUsername}
                  onChange={(e) => setNewFriendUsername(e.target.value)}
                  className="mb-3"
                />
                <MDBBtn color="primary" onClick={handleAddFriend}>
                  <MDBIcon fas icon="user-plus" className="me-2" />
                  Send Request
                </MDBBtn>
                {requestStatus && <p className="mt-3 text-muted">{requestStatus}</p>}
              </MDBCardBody>
            </MDBCard>
          </MDBTabsPane>
        </MDBTabsContent>
      </>
    );
  }