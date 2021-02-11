import React, { useState, useEffect } from 'react';
import Loading from "./Loading";
import PerformanceMap from "./PerformanceMap";
import Legend from "./Legend";
import LoadStreetsTask from "../tasks/LoadStreetsTask";

const TransitVis = () => {
  const [streets, setStreets] = useState([]);

  const load = () => {
    console.log("loading");
    const loadStreetsTask = new LoadStreetsTask();
    loadStreetsTask.load((streets) => setStreets(streets));
  }
  useEffect(load, []);

  return (
    <div>
      {streets.length === 0 ? (
        <Loading />
      ) : (
        <div>
          <PerformanceMap />
          <Legend />
        </div>
        )
      }
    </div>
  )
}

export default TransitVis;