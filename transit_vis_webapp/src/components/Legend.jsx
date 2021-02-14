import L from "leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

const Legend = (props) => {
  const map = useMap();
  const legendItems = props.legendItems.getLegendItemsAry();

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
    legend.addTo(map);
    return () => {
      map.removeControl(legend);
    };
  });
  return null;
};

export default Legend;