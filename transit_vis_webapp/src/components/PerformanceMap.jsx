import React from 'react';
import {MapContainer, GeoJSON, TileLayer} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./PerformanceMap.css";

const mapbox_token = "pk.eyJ1IjoiemFlNW9wIiwiYSI6ImNra29lNnppbzBvemwzMW1hdG9yMHQ0OGwifQ.YiQJrjX21uFntaF8sI1OQg";
const mapbox_url = "https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=".concat(mapbox_token);
const mapbox_attribution = '© <a href="https://www.mapbox.com/feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const PerformanceMap = ({ streets }) => {

  const jsonStyle = (street) => {
    if (street.properties.SPEED != undefined) {
      return ({
        fillOpacity: 1.0,
        weight: 5
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

  return (
      <MapContainer 
        center={[47.606209, -122.332069]}
        zoom={14}
        zoomSnap={0}
        zoomDelta={.1}>
          <TileLayer
            attribution={mapbox_attribution}
            url={mapbox_url}
          />
          <GeoJSON
              data={streets}
              onEachFeature={onEachStreet}
              className="streets"
              style={jsonStyle}
          />
    </MapContainer>
  );
};

export default PerformanceMap;