import L from "leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import legendItems from "../entities/LegendItems";

const Legend = (props) => {
  const metric = props.metric;
  const streets = props.streets;
  const map = useMap();

  //TODO calculate legend breaks, assign colors, etc

  // Run when map is mounted
  useEffect(() => {
    const legend = L.control({ position: "bottomleft" });
    legend.onAdd = () => {
      //TODO remove if exists
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
    legend.addTo(map);
  });
  return null;
};

export default Legend;