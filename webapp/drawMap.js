L.mapbox.accessToken = "pk.eyJ1IjoiemFlNW9wIiwiYSI6ImNra29lNnppbzBvemwzMW1hdG9yMHQ0OGwifQ.YiQJrjX21uFntaF8sI1OQg";
var GRADES = [0, 2, 4, 6, 8, 10]
var COLORS = ['#d73027','#fc8d59','#fee090','#e0f3f8','#91bfdb','#4575b4']
var map = L.map('map').setView([47.606209, -122.332069], 13);

// Add Mapbox tiles to map
var mapboxTiles = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=' + L.mapbox.accessToken, {
  attribution: '© <a href="https://www.mapbox.com/feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  tileSize: 512,
  zoomOffset: -1
}).addTo(map);

// Add legend to map
var legend = L.control({position: 'bottomright'});
legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
        labels = [];
    // Generate a label with a colored square for each interval
    for (var i = 0; i < GRADES.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(GRADES[i] + 1) + '"></i> ' +
            GRADES[i] + (GRADES[i + 1] ? '&ndash;' + GRADES[i + 1] + '<br>' : '+');
    };
    return div;
};
legend.addTo(map);

// Add box with info for highlighted segments
var info = L.control();
info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};
info.update = function (properties) {
    this._div.innerHTML = '<h4>Median Daily Speed</h4>' +
      (properties ? 'Compkey:' + properties.COMPKEY + '<br /><br />' + properties.SPEED + ' mph</p>': 'Hover a Segment');
};
info.addTo(map);

// Define color scheme for metrics
function getColor(d) {
  return  d > GRADES[5] ? COLORS[5] :
          d > GRADES[4] ? COLORS[4] :
          d > GRADES[3] ? COLORS[3] :
          d > GRADES[2] ? COLORS[2] :
          d > GRADES[1] ? COLORS[1] :
          COLORS[0] ;
};
var styleFunction = function(feature) {
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

// Add geojson to map, after dynamodb query (called from queryDynamo)
function drawGeojson() {

  // Add mouseover highlighting to map
  function highlightFeature(e) {
    var layer = e.target;
    layer.setStyle({
        weight: 15,
        opacity: 1.0
    });
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    };
    info.update(layer.feature.properties);
  };

  function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
  };

  function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
  };

  function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
  };

  // Add our geoJSON
  var geojson = L.geoJSON(streets, {
    style: styleFunction,
    onEachFeature: onEachFeature
  }).addTo(map);
};