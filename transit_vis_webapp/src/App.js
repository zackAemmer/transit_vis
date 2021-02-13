import React from 'react';
import TransitVis from "./components/TransitVis";
import './App.css';
import 'leaflet/dist/leaflet.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      </header>
      <TransitVis />
    </div>
  );
};

export default App;