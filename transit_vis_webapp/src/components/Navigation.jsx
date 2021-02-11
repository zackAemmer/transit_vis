import React from "react";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import "./Navigation.css";

const Navigation = () => {
    return (
      <div>
          <Navbar bg="light" expand="lg">
            <Navbar.Brand href="#home">TransitVis</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="mr-auto">
                <Nav.Link href="#home">Home</Nav.Link>
                <Nav.Link href="#link">Github</Nav.Link>
                <Nav.Link href="#link">About</Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Navbar>
      </div>
    );
}

export default Navigation;