import React, { useRef } from 'react';
import {MapContainer, GeoJSON, TileLayer} from "react-leaflet";
import Legend from "./Legend";
import "leaflet/dist/leaflet.css";

const mapbox_token = "pk.eyJ1IjoiemFlNW9wIiwiYSI6ImNra29lNnppbzBvemwzMW1hdG9yMHQ0OGwifQ.YiQJrjX21uFntaF8sI1OQg";
const mapbox_url = "https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=".concat(mapbox_token);
const mapbox_attribution = '© <a href="https://www.mapbox.com/feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const PerformanceMap = (props) => {

  const jsonStyle = (feature) => {
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
    }
    if (featureValue != undefined) {
      return ({
        fillOpacity: 1.0,
        weight: 10
      });
    } else {
      return ({
        fillOpacity: 0.7,
        weight: 3
      });
    };
  };

  const onEachStreet = (street, layer) => {
    layer.options.color = street.properties.color;
    const name = street.properties.STNAME_ORD;
    const speed = street.properties.SPEED;
    layer.bindPopup(`${name} ${speed}`);
  };

  const renderGeoJSON = (features) => {
    console.log("Rendering GeoJSON");
    return (
      <GeoJSON
        data={features}
        onEachFeature={onEachStreet}
        className="geoJSON"
        style={jsonStyle}
      />
    );
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
        { renderGeoJSON(props.streets) }
        <Legend streets={props.streets} metric={props.metric}/>
      </MapContainer>
    </div>
  );
};

export default PerformanceMap;