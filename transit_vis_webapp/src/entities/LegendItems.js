import LegendItem from "./LegendItem";

const GRADES = [0, 2, 4, 6, 8, 10];
const COLORS = ['#d73027','#fc8d59','#fee090','#e0f3f8','#91bfdb','#4575b4'];
const UNITS = "mph";

const legendItems = [
    new LegendItem(
        GRADES[0] + "-" + GRADES[1] + " " + UNITS,
        COLORS[0],
        (speed) => speed < GRADES[1]
    ),
    new LegendItem(
        GRADES[1] + "-" + GRADES[2] + " " + UNITS,
        COLORS[1],
        (speed) => speed >= GRADES[1] && speed < GRADES[2]
    ),
    new LegendItem(
        GRADES[2] + "-" + GRADES[3] + " " + UNITS,
        COLORS[2],
        (speed) => speed >= GRADES[2] && speed < GRADES[3]
    ),
    new LegendItem(
        GRADES[3] + "-" + GRADES[4] + " " + UNITS,
        COLORS[3],
        (speed) => speed >= GRADES[3] && speed < GRADES[4]
    ),
    new LegendItem(
        GRADES[4] + "-" + GRADES[5] + " " + UNITS,
        COLORS[4],
        (speed) => speed >= GRADES[4] && speed < GRADES[5]
    ),
    new LegendItem(
        GRADES[5] + "+" + " " + UNITS,
        COLORS[5],
        (speed) => speed >= GRADES[5]
    ),
    new LegendItem(
        "No Data",
        "#696969",
        (speed) => true
    )
];

export default legendItems;