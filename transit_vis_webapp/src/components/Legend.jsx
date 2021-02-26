import L from "leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

const Legend = (props) => {
  const map = useMap();

  useEffect(() => {
    const legendItemsAry = props.legendItems.getLegendItemsAry();
    const legend = L.control({ position: "bottomleft" });
    legend.onAdd = () => {
      const div = L.DomUtil.create("div", "info legend");
      const labels = [];
      for (let i = 0; i < legendItemsAry.length; i++) {
        labels.push(
          '<i style="background:' +
          legendItemsAry[i].color +
          '"></i> ' +
          legendItemsAry[i].title
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