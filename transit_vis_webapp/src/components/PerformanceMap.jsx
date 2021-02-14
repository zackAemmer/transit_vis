import React, { useRef } from 'react';
import {MapContainer, GeoJSON, TileLayer} from "react-leaflet";
import Legend from "./Legend";
import "leaflet/dist/leaflet.css";

const PerformanceMap = (props) => {

  const mapbox_token = "pk.eyJ1IjoiemFlNW9wIiwiYSI6ImNra29lNnppbzBvemwzMW1hdG9yMHQ0OGwifQ.YiQJrjX21uFntaF8sI1OQg";
  const mapbox_url = "https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=".concat(mapbox_token);
  const mapbox_attribution = '© <a href="https://www.mapbox.com/feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  const legendItems = props.legendItems.getLegendItemsAry();

  const getRandomKey = () => {
    return Math.random();
  };

  // Check metric and legend bins to assign a color value/popup to each feature
  const assignColor = (feature, layer) => {

    var featureValue;
    switch (props.metric) {
      case "SPEED":
        featureValue = feature.properties.SPEED;
        break;
      case "SPEED_PCT":
        featureValue = feature.properties.SPEED_PCT;
        break;
      case "SPEED_VAR":
        featureValue = feature.properties.SPEED_VAR;
        break;
      case "DEVIATION":
        featureValue = feature.properties.DEVIATION;
        break;
      case "TRAVERSALS":
        featureValue = feature.properties.TRAVERSALS;
        break;
    };

    const legendItem = legendItems.find((item) => item.isFor(featureValue));
    if (legendItem != null) {
      feature.properties.color = legendItem.color;
      layer.options.color = feature.properties.color;
    };

    const name = feature.properties.STNAME_ORD;
    const metric = featureValue;
    layer.bindPopup(`${name}: ${metric}`);
  };

  return (
    <div>
      <MapContainer
        center={[47.606209, -122.332069]}
        zoom={14}>
        <TileLayer
          attribution={mapbox_attribution}
          url={mapbox_url}
        />
        <GeoJSON
          key={getRandomKey()} // Leaflet will not tell React to re-render unless key changes
          data={props.streets}
          onEachFeature={assignColor}
          className="geoJSON"
        />
        <Legend legendItems={props.legendItems}/>
      </MapContainer>
    </div>
  );
};

export default PerformanceMap;