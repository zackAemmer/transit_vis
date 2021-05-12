import React from 'react';
import {MapContainer, GeoJSON, TileLayer} from "react-leaflet";
import Legend from "./Legend";
import "leaflet/dist/leaflet.css";
var route_compkey_dict = require("../data/route_compkey_dict.json");


const PerformanceMap = (props) => {

  const mapbox_token = "pk.eyJ1IjoiemFlNW9wIiwiYSI6ImNra29lNnppbzBvemwzMW1hdG9yMHQ0OGwifQ.YiQJrjX21uFntaF8sI1OQg";
  const mapbox_url = "https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=".concat(mapbox_token);
  const mapbox_attribution = '© <a href="https://www.mapbox.com/feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  const legendItemsAry = props.legendItems.getLegendItemsAry();

  const getRandomKey = () => {
    return Math.random();
  };

  const checkFilter = (feature, layer) => {
    // Is there a specific route selected in the filter control
    let filterRoute = props.filterRoute;
    if (filterRoute==='allRoutes') {
      return true;
    };
    // If so, what compkeys correspond to that route
    const compkeysToShow = route_compkey_dict[filterRoute];
    // Is this feature's compkey in that list, or not
    if (compkeysToShow.includes(feature.properties.COMPKEY)) {
      return true;
    } else {
      return false;
    }
  }

  // Check metric and legend bins to assign a color value/popup to each feature
  const assignColor = (feature, layer) => {

    var featureValue;
    var dateUpdated;
    if (props.filterTime==='AM') {
      dateUpdated = feature.properties.DATE_UPDATED_AM;
      switch (props.metric) {
        case "SPEED_MED":
          featureValue = feature.properties.SPEED_MED_AM;
          break;
        case "SPEED_STD":
          featureValue = feature.properties.SPEED_STD_AM;
          break;
        case "SPEED_PCT_95":
          featureValue = feature.properties.SPEED_PCT_95_AM;
          break;
        case "SPEED_PCT_5":
          featureValue = feature.properties.SPEED_PCT_5_AM;
          break;
        case "PACE_MED":
          featureValue = feature.properties.PACE_MED_AM;
          break;
        case "DEVIATION_MED":
          featureValue = feature.properties.DEVIATION_MED_AM;
          break;
        case "DEVIATION_STD":
          featureValue = feature.properties.DEVIATION_STD_AM;
          break;
        case "TRAVERSALS":
          featureValue = feature.properties.TRAVERSALS_AM;
          break;
      };
    } else if (props.filterTime==='PM') {
      dateUpdated = feature.properties.DATE_UPDATED_PM;
      switch (props.metric) {
        case "SPEED_MED":
          featureValue = feature.properties.SPEED_MED_PM;
          break;
        case "SPEED_STD":
          featureValue = feature.properties.SPEED_STD_PM;
          break;
        case "SPEED_PCT_95":
          featureValue = feature.properties.SPEED_PCT_95_PM;
          break;
        case "SPEED_PCT_5":
          featureValue = feature.properties.SPEED_PCT_5_PM;
          break;
        case "PACE_MED":
          featureValue = feature.properties.PACE_MED_PM;
          break;
        case "DEVIATION_MED":
          featureValue = feature.properties.DEVIATION_MED_PM;
          break;
        case "DEVIATION_STD":
          featureValue = feature.properties.DEVIATION_STD_PM;
          break;
        case "TRAVERSALS":
          featureValue = feature.properties.TRAVERSALS_PM;
          break;
      };
    } else {
      dateUpdated = feature.properties.DATE_UPDATED_FULL_DAY;
      switch (props.metric) {
        case "SPEED_MED":
          featureValue = feature.properties.SPEED_MED_FULL_DAY;
          break;
        case "SPEED_STD":
          featureValue = feature.properties.SPEED_STD_FULL_DAY;
          break;
        case "SPEED_PCT_95":
          featureValue = feature.properties.SPEED_PCT_95_FULL_DAY;
          break;
        case "SPEED_PCT_5":
          featureValue = feature.properties.SPEED_PCT_5_FULL_DAY;
          break;
        case "PACE_MED":
          featureValue = feature.properties.PACE_MED_FULL_DAY;
          break;
        case "DEVIATION_MED":
          featureValue = feature.properties.DEVIATION_MED_FULL_DAY;
          break;
        case "DEVIATION_STD":
          featureValue = feature.properties.DEVIATION_STD_FULL_DAY;
          break;
        case "TRAVERSALS":
          featureValue = feature.properties.TRAVERSALS_FULL_DAY;
          break;
      };
    };

    const legendItem = legendItemsAry.find((item) => item.isFor(featureValue));
    if (legendItem != null) {
      feature.properties.color = legendItem.color;
      layer.options.color = feature.properties.color;
    };

    const name = feature.properties.FULLNAME;
    const metric = Math.round(featureValue * 10) / 10;
    const update_date = dateUpdated;
    layer.bindPopup(`Street Name: ${name}:<br> Metric Value: ${metric}<br> Last Updated: ${dateUpdated}PST`);
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
          filter={checkFilter}
          onEachFeature={assignColor}
          className="geoJSON"
          preferCanvas={true}
        />
        <Legend legendItems={props.legendItems}/>
      </MapContainer>
  );
};

export default PerformanceMap;