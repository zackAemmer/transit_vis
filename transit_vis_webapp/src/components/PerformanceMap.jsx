import React, { useRef } from 'react';
import {MapContainer, GeoJSON, TileLayer} from "react-leaflet";
import Legend from "./Legend";
import "leaflet/dist/leaflet.css";

const PerformanceMap = (props) => {

  const mapbox_token = "pk.eyJ1IjoiemFlNW9wIiwiYSI6ImNra29lNnppbzBvemwzMW1hdG9yMHQ0OGwifQ.YiQJrjX21uFntaF8sI1OQg";
  const mapbox_url = "https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=".concat(mapbox_token);
  const mapbox_attribution = '© <a href="https://www.mapbox.com/feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  const legendItemsAry = props.legendItems.getLegendItemsAry();

  const getRandomKey = () => {
    return Math.random();
  };

  // Check metric and legend bins to assign a color value/popup to each feature
  const assignColor = (feature, layer) => {

    var featureValue;
    switch (props.metric) {
      case "SPEED_MED":
        featureValue = feature.properties.SPEED_MED;
        break;
      case "SPEED_STD":
        featureValue = feature.properties.SPEED_STD;
        break;
      case "SPEED_PCT_95":
        featureValue = feature.properties.SPEED_PCT_95;
        break;
      case "SPEED_PCT_5":
        featureValue = feature.properties.SPEED_PCT_5;
        break;
      case "DEVIATION_MED":
        featureValue = feature.properties.DEVIATION_MED;
        break;
      case "DEVIATION_STD":
        featureValue = feature.properties.DEVIATION_STD;
        break;
      case "TRAVERSALS":
        featureValue = feature.properties.TRAVERSALS;
        break;
    };

    const legendItem = legendItemsAry.find((item) => item.isFor(featureValue));
    if (legendItem != null) {
      feature.properties.color = legendItem.color;
      layer.options.color = feature.properties.color;
    };

    const name = feature.properties.STNAME_ORD;
    const metric = Math.round(featureValue * 10) / 10;
    layer.bindPopup(`${name}: ${metric}`);
  };

  return (
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
  );
};

export default PerformanceMap;