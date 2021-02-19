import React, { useState, useEffect } from 'react';
import { Switch, Route } from "react-router-dom";
import About from "./About";
import Loading from "./Loading";
import LoadStreetsTask from "../tasks/LoadStreetsTask";
import MapControls from "./MapControls";
import Navigation from "./Navigation";
import PerformanceMap from "./PerformanceMap";
import LegendItems from '../entities/LegendItems';

const TransitVis = () => {
  // Variables that define site state; (change as user interacts with site)
  const [streets, setStreets] = useState([]);
  const [metric, setMetric] = useState("SPEED");

  // Constant list of bins that updates with state and gets passed down
  const legendItems = new LegendItems(streets, metric);

  // Get the street data from dynamodb and store it in the state variable
  function load() {
    console.log("Loading Streets");
    const loadStreetsTask = new LoadStreetsTask();
    loadStreetsTask.load((streets) => setStreets(streets));
  };

  // When TransitVis is created, run the load function above once
  useEffect(load, []);

  // After streets are done loading, swap the load screen for map components
  if (streets.length === 0) {
    return (
      <div className="App-body">
        <Navigation />
        <Loading />
      </div>
    );
  } else {
    return (
      <div className="App-body">
        <Navigation />
        <Switch>
          <Route path="/about">
            <About />
          </Route>
          <Route exact path="/">
            <PerformanceMap streets={streets} legendItems={legendItems} metric={metric}/>
            <MapControls metric={metric} onChange={(metric) => setMetric(metric)}/>
          </Route>
        </Switch>
    </div>
    );
  };
};

export default TransitVis;