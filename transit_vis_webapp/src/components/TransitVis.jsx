import React, { useState, useEffect } from 'react';
import Loading from "./Loading";
import PerformanceMap from "./PerformanceMap";
import Navigation from "./Navigation";
import MapControls from "./MapControls";
import LoadStreetsTask from "../tasks/LoadStreetsTask";

const TransitVis = () => {
  const [streets, setStreets] = useState([]);
  const [selectedMetric, setMetric] = useState(["SPEED"]);

  const load = () => {
    const loadStreetsTask = new LoadStreetsTask();
    loadStreetsTask.load((streets) => setStreets(streets));
  }

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
          <PerformanceMap streets={streets} selectedMetric={selectedMetric}/>
          <MapControls />
        </div>
      )}
    </div>
  );
};

export default TransitVis;