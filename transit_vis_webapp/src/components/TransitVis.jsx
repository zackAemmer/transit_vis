import React, { useState, useEffect } from 'react';
import Loading from "./Loading";
import LoadStreetsTask from "../tasks/LoadStreetsTask";
import MapControls from "./MapControls";
import Navigation from "./Navigation";
import PerformanceMap from "./PerformanceMap";

const TransitVis = () => {
  const [streets, setStreets] = useState([]);
  const [metric, setMetric] = useState("SPEED");

  function load() {
    console.log("Loading Streets");
    const loadStreetsTask = new LoadStreetsTask();
    loadStreetsTask.load((streets) => setStreets(streets));
  };

  useEffect(load, []);

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
          <PerformanceMap streets={streets} metric={metric}/>
          <MapControls metric={metric} onChange={(metric) => setMetric(metric)}/>
        </div>
      )}
    </div>
  );
};

export default TransitVis;