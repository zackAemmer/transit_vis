var map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

L.marker([51.5, -0.09]).addTo(map)
    .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
    .openPopup();


/*
let data = {};
const dataUrl = 'https://cors-anywhere.herokuapp.com/https://docs.mapbox.com/help/data/stations.geojson';

const map = L.map('mapid').setView([38.8977, -77.0365], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 18,
  id: 'mapbox/streets-v11',
  tileSize: 512,
  zoomOffset: -1,
}).addTo(map);

fetch(dataUrl)
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data, {
      pointToLayer: function (feature, coords) {
        return L.marker(coords, {
          icon: new L.Icon({
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [1, -24],
            iconUrl: 'https://cdn.iconscout.com/icon/free/png-256/metro-subway-underground-train-railway-engine-emoj-symbol-30744.png'
          })
        });
      },
      onEachFeature: function (feature, layer) {
        layer.bindPopup(
          '<h4>'
          + feature.properties.title
          + '</h4>'
          + '<p>'
          + feature.properties.address
          + '</p>'
        );
      }
    }).addTo(map);
  })
  .catch(err => console.error(err));
  */