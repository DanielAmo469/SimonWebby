import React from "react";
import {
  MDBNavbar,
  MDBNavbarBrand,
  MDBNavbarNav,
  MDBNavbarItem,
  MDBNavbarLink,
  MDBBtn,
  MDBIcon,
  MDBBadge,
  MDBContainer,
} from "mdb-react-ui-kit";
import { useNavigate } from "react-router-dom";

const Navbar = ({ requestCount }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    window.location.reload();
  };

  return (
    <MDBNavbar expand="lg" dark bgColor="primary">
      <MDBContainer>
        <MDBNavbarBrand href="/">Smart Simon</MDBNavbarBrand>
        <MDBNavbarNav className="mr-auto">
          <MDBNavbarItem>
            <MDBNavbarLink href="/friends">Friends</MDBNavbarLink>
          </MDBNavbarItem>
          <MDBNavbarItem>
            <MDBNavbarLink href="/my-account">
              My Account
            </MDBNavbarLink>
          </MDBNavbarItem>
          <MDBNavbarItem>
            <MDBNavbarLink href="/volume-settings">
              Volume Settings
            </MDBNavbarLink>
          </MDBNavbarItem>
        </MDBNavbarNav>
        <div className="gap-3 d-flex align-items-center">
          <div style={{ position: "relative" }}>
            <a
              href="/notifications"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <MDBIcon far icon="bell" size="xl" />
            </a>
            {requestCount > 0 && (
              <MDBBadge
                pill
                color="danger"
                notification
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-10px",
                  zIndex: "10",
                  fontSize: "0.8rem", 
                }}
              >
                {requestCount}
              </MDBBadge>
            )}
          </div>
          <MDBBtn
            rounded
            color="danger"
            size="lg"
            className="px-3 d-flex align-items-center"
            onClick={handleLogout}
          >
            <span>Logout</span>
            <MDBIcon fas icon="sign-out-alt" className="ms-2" />
          </MDBBtn>
        </div>
      </MDBContainer>
    </MDBNavbar>
  );
};

export default Navbar;
