import {quantile} from "d3-array";
import LegendItem from "./LegendItem";

class LegendItems {
    constructor(streets, metric) {
        this.colors = ['#d73027','#fc8d59','#fee090','#e0f3f8','#91bfdb','#4575b4'];
        this.numBins = 6;
        this.features = streets;
        this.metric = metric;
    }

    getMetricAry = function() {
        var metric_ary = [];

        for (let i=0; i<this.features.length; i++) {
            switch (this.metric) {
                case "SPEED":
                    if (this.features[i].properties.SPEED != undefined) {
                        metric_ary.push(this.features[i].properties.SPEED);
                    };
                    break;
                case "SPEED_PCT":
                    if (this.features[i].properties.SPEED_PCT != undefined) {
                        metric_ary.push(this.features[i].properties.SPEED_PCT);
                    };
                    break;
                case "SPEED_VAR":
                    if (this.features[i].properties.SPEED_VAR != undefined) {
                        metric_ary.push(this.features[i].properties.SPEED_VAR);
                    };
                    break;
                case "DEVIATION":
                    if (this.features[i].properties.DEVIATION != undefined) {
                        metric_ary.push(this.features[i].properties.DEVIATION);
                    };
                    break;
                case "TRAVERSALS":
                    if (this.features[i].properties.TRAVERSALS != undefined) {
                        metric_ary.push(this.features[i].properties.TRAVERSALS);
                    };
                    break;
              };
        };
        return (metric_ary);
    };

    calculateGrades = function() {
        const grades = [];
        const groupType = "percentiles";
        const metric_ary = this.getMetricAry();

        if (groupType === "equalIntervals") {
            const min = min(metric_ary);
            const max = max(metric_ary);
            var binSize = ((max - min) / this.numBins);
            var current = min;
            for (let i=0; i<this.numBins; i++) {
                var x = Math.round(current*10)/10
                grades.push(x);
                current = current+binSize;
            };
            return (grades);
        } else if (groupType === "percentiles") {
            const min = 0.0;
            const max = 1.0;
            var binSize = ((max - min) / this.numBins);
            var current = min;
            for (let i=0; i<this.numBins; i++) {
                var x = quantile(metric_ary, current);
                x = Math.round(x*10)/10;
                grades.push(x);
                current = current+binSize;
            };
            return (grades);
        };
        return (null);
    };

    getUnits = function() {
        switch (this.metric) {
            case "SPEED":
                return ("m/s");
            case "SPEED_PCT":
                return ("m/s");
            case "SPEED_VAR":
                return ("m/s");
            case "DEVIATION":
                return ("s");
            case "TRAVERSALS":
                return ("trips");
          };
    };

    getLegendItemsAry = function() {
        const GRADES = this.calculateGrades();
        const COLORS = this.colors;
        const UNITS = this.getUnits();

        const testItems = [
            new LegendItem(
                GRADES[0] + " &ndash; " + GRADES[1] + " " + UNITS,
                COLORS[0],
                (speed) => speed < GRADES[1]
            ),
            new LegendItem(
                GRADES[1] + " &ndash; " + GRADES[2] + " " + UNITS,
                COLORS[1],
                (speed) => speed >= GRADES[1] && speed < GRADES[2]
            ),
            new LegendItem(
                GRADES[2] + " &ndash; " + GRADES[3] + " " + UNITS,
                COLORS[2],
                (speed) => speed >= GRADES[2] && speed < GRADES[3]
            ),
            new LegendItem(
                GRADES[3] + " &ndash; " + GRADES[4] + " " + UNITS,
                COLORS[3],
                (speed) => speed >= GRADES[3] && speed < GRADES[4]
            ),
            new LegendItem(
                GRADES[4] + " &ndash; " + GRADES[5] + " " + UNITS,
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

        return (testItems);
    };
};

export default LegendItems;