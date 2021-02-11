import React from 'react';
import './App.css';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import 'leaflet/dist/leaflet.css';
import TransitVis from "./components/TransitVis";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <title>TransitVis</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <meta property="og:image" content="https://raw.githubusercontent.com/zackAemmer/transit_vis/main/webapp/thumbnail.JPG"/>
        <meta property="og:title" content="Transit Vis - Real-Time Seattle Transit Performance Metrics"/>
        <meta property="og:description" content="A visualization tool for segment-based transit performance throughout the Seattle region."/>
        <script src="loadStreets.js"></script>
      </header>
      <div className="navigation-bar">
        <h3>TransitVis</h3>
        <Navbar bg="light" expand="lg">
          <Navbar.Brand href="#home">React-Bootstrap</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
              <Nav.Link href="#home">Home</Nav.Link>
              <Nav.Link href="#link">Link</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
      </div>
      <TransitVis />
    </div>
  )
}

export default App;