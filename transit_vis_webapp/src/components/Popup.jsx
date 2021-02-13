import { useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

function Popup() {
    const map = useMap();

    useEffect(() => {
        const popup = L.control({ position: "bottomright" });
        popup.onAdd = () => {
            const div = L.DomUtil.create("div", "info popup");
            div.innerHTML = '<p>Popup</p>';
            return div;
        };
        // popup.update = () => {
        //     div.innerHTML = '<h4>Median Daily Speed</h4>' +
        //     (properties ? 'Compkey:' + properties.COMPKEY + '<br /><br />' + Math.round(properties.SPEED*2.24 * 10) / 10 + ' mph</p>': 'Hover a Segment');
        // }
        popup.addTo(map);
    });
    return null;
};

export default Popup;