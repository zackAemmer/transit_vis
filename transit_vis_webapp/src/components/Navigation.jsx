import React from "react";

import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";

const Navigation = () => {
    return (
      <div className="navigation-bar">
        <Navbar bg="dark" variant="dark" expand="md">
          <Navbar.Brand>TransitVis</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
              <Nav.Link href="https://www.transitvis.com">Home</Nav.Link>
              <Nav.Link href="https://github.com/zackAemmer/transit_vis">Github</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
      </div>
    );
};

export default Navigation;