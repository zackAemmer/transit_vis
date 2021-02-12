import React from 'react';
import './App.css';
import 'leaflet/dist/leaflet.css';
import TransitVis from "./components/TransitVis";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <script src="loadStreets.js"></script>
      </header>
      <TransitVis />
    </div>
  )
}

export default App;