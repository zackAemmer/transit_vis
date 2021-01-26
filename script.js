let data = {};
const dataUrl = 'https://cors-anywhere.herokuapp.com/https://docs.mapbox.com/help/data/stations.geojson';

const map = L.map('mapid').setView([38.8977, -77.0365], 15);

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
  maxZoom: 18,
  id: 'mapbox/streets-v11',
  tileSize: 512,
  zoomOffset: -1,
  accessToken: 'pk.eyJ1Ijoic3VkaXB0b2c4MSIsImEiOiJjanBzNXY1ZHUwNWI1NDNscHEzM3N3bnplIn0.ocXoObxyCMNmhzBOeRdQsA'
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