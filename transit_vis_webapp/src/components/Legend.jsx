import { useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import legendItems from "../entities/LegendItems";

function Legend() {
  const map = useMap();

  // Run when map is mounted
  useEffect(() => {
    const legend = L.control({ position: "bottomleft" });
    legend.onAdd = () => {
      const div = L.DomUtil.create("div", "info legend");
      const labels = [];
      for (let i = 0; i < legendItems.length; i++) {
        labels.push(
          '<i style="background:' +
            legendItems[i].color +
            '"></i> ' +
            legendItems[i].title
        );
      };
      div.innerHTML = labels.join("<br>");
      return div;
    };
    legend.onRemove = () => {
      return;
    };
    legend.addTo(map);
  });
  return null;
};

export default Legend;