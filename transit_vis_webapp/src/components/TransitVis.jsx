import React, { useState, useEffect } from 'react';
import Loading from "./Loading";
import PerformanceMap from "./PerformanceMap";
import Legend from "./Legend";
import Navigation from "./Navigation";
import LoadStreetsTask from "../tasks/LoadStreetsTask";

const TransitVis = () => {
  const [streets, setStreets] = useState([]);

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
          <PerformanceMap streets={streets} />
          <Legend />
        </div>
      )}
    </div>
  );
};

export default TransitVis;