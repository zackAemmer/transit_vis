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
                case "SPEED_MED":
                    if (this.features[i].properties.SPEED_MED != undefined) {
                        metric_ary.push(this.features[i].properties.SPEED_MED);
                    };
                    break;
                case "SPEED_STD":
                    if (this.features[i].properties.SPEED_STD != undefined) {
                        metric_ary.push(this.features[i].properties.SPEED_STD);
                    };
                    break;
                case "SPEED_PCT_95":
                    if (this.features[i].properties.SPEED_PCT_95 != undefined) {
                        metric_ary.push(this.features[i].properties.SPEED_PCT_95);
                    };
                    break;
                case "SPEED_PCT_5":
                    if (this.features[i].properties.SPEED_PCT_5 != undefined) {
                        metric_ary.push(this.features[i].properties.SPEED_PCT_5);
                    };
                    break;
                case "DEVIATION_MED":
                    if (this.features[i].properties.DEVIATION_MED != undefined) {
                        metric_ary.push(this.features[i].properties.DEVIATION_MED);
                    };
                    break;
                case "DEVIATION_STD":
                    if (this.features[i].properties.DEVIATION_STD != undefined) {
                        metric_ary.push(this.features[i].properties.DEVIATION_STD);
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
            case "SPEED_MED":
                return ("mph");
            case "SPEED_STD":
                return ("mph");
            case "SPEED_PCT_95":
                return ("mph");
            case "SPEED_PCT_5":
                return ("mph");
            case "DEVIATION_MED":
                return ("s");
            case "DEVIATION_STD":
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
                (metric) => metric < GRADES[1]
            ),
            new LegendItem(
                GRADES[1] + " &ndash; " + GRADES[2] + " " + UNITS,
                COLORS[1],
                (metric) => metric >= GRADES[1] && metric < GRADES[2]
            ),
            new LegendItem(
                GRADES[2] + " &ndash; " + GRADES[3] + " " + UNITS,
                COLORS[2],
                (metric) => metric >= GRADES[2] && metric < GRADES[3]
            ),
            new LegendItem(
                GRADES[3] + " &ndash; " + GRADES[4] + " " + UNITS,
                COLORS[3],
                (metric) => metric >= GRADES[3] && metric < GRADES[4]
            ),
            new LegendItem(
                GRADES[4] + " &ndash; " + GRADES[5] + " " + UNITS,
                COLORS[4],
                (metric) => metric >= GRADES[4] && metric < GRADES[5]
            ),
            new LegendItem(
                GRADES[5] + "+" + " " + UNITS,
                COLORS[5],
                (metric) => metric >= GRADES[5]
            ),
            new LegendItem(
                "No Data",
                "#696969",
                (metric) => true
            )
        ];

        return (testItems);
    };
};

export default LegendItems;