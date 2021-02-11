import React from 'react';
import {MapContainer, GeoJSON, TileLayer} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./PerformanceMap.css";

const mapbox_token = "pk.eyJ1IjoiemFlNW9wIiwiYSI6ImNra29lNnppbzBvemwzMW1hdG9yMHQ0OGwifQ.YiQJrjX21uFntaF8sI1OQg";
const mapbox_url = "https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=".concat(mapbox_token);
const mapbox_attribution = '© <a href="https://www.mapbox.com/feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const PerformanceMap = ({ streets }) => {

    // Functions for coloring map
    var GRADES = [0, 2, 4, 6, 8, 10]
    var COLORS = ['#d73027','#fc8d59','#fee090','#e0f3f8','#91bfdb','#4575b4']
    function getColor(d) {
    return  d > GRADES[5] ? COLORS[5] :
            d > GRADES[4] ? COLORS[4] :
            d > GRADES[3] ? COLORS[3] :
            d > GRADES[2] ? COLORS[2] :
            d > GRADES[1] ? COLORS[1] :
            COLORS[0] ;
    };
    const mapStyle = function(feature) {
        if (feature.properties.SPEED == null) {
            return {
            "color": "#969696",
            "weight": 4,
            "opacity": 0.7
            };
        } else {
            return {
            "color": getColor(feature.properties.SPEED),
            "weight": 6,
            "opacity": 0.9
            };
        };
    };

    const onEachStreet = (street, layer) => {
        layer.options.fillColor = street.properties.color;
        const name = street.properties.UNITDESC;
        const speed = street.properties.SPEED;
        layer.bindPopup(`${name} ${speed}`);
    }

    return (
        <MapContainer style={{height: "90vh"}} center={[47.606209, -122.332069]} zoom={14}>
            <TileLayer
            attribution={mapbox_attribution}
            url={mapbox_url}
            />
            <GeoJSON
                data={streets}
                onEachFeature={onEachStreet}
            />
      </MapContainer>
    );
}

export default PerformanceMap;









// Functions for map interactivity
function onClick(event) {
    console.log(event.target);
    event.target.setStyle({
      "weight": 20,
      "color": "#111"
    });
  }
  var popupFunction = function(segment, layer) {
    layer.bindPopup(segment.properties.UNITDESC);
    layer.on({
      click: onClick
    });
  };
  