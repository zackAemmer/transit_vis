var map = L.map('map').setView([47.606209, -122.332069], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var styleFunction = function(feature) {
  if (feature.properties.TRANCLASS == 3) {
    return {
      "color": "#ff7800",
      "weight": 5,
      "opacity": 0.65
    };
  } else {
    return {
      "color": "#0000ff",
      "weight": 5,
      "opacity": 0.65
    };
  }
};



L.geoJSON(streets, {
  style: styleFunction
}).addTo(map);