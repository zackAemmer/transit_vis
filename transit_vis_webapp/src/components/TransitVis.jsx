import React, { useState, useEffect } from 'react';
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
  return (
    <div>
      {streets.length === 0 ? (
        <div>
          <Navigation />
          <Loading />
        </div>
      ) : (
        <div>
          <Navigation />
          <PerformanceMap streets={streets} legendItems={legendItems} metric={metric}/>
          <MapControls metric={metric} onChange={(metric) => setMetric(metric)}/>
        </div>
      )}
    </div>
  );
};

export default TransitVis;