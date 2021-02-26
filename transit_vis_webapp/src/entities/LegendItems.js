import {quantile} from "d3-array";
import LegendItem from "./LegendItem";
import * as d3ScaleChromatic from "d3-scale-chromatic";

class LegendItems {
    constructor(streets, metric, gradient, bins, scaleType) {
        this.features = streets;
        this.metric = metric;
        this.gradient = gradient;
        this.numBins = bins;
        this.scaleType = scaleType;
    }

    getMetricAry = function() {
        var metric_ary = [];

        // Check each geoJSON element to get an array of the chosen metric
        for (let i=0; i<this.features.length; i++) {
            switch (this.metric) {
                case "SPEED_MED":
                    metric_ary.push(this.features[i].properties.SPEED_MED);
                    break;
                case "SPEED_STD":
                    metric_ary.push(this.features[i].properties.SPEED_STD);
                    break;
                case "SPEED_PCT_95":
                    if (this.scaleType == "shared") {
                        metric_ary.push(this.features[i].properties.SPEED_MED);
                    } else {
                        metric_ary.push(this.features[i].properties.SPEED_PCT_95);
                    };
                    break;
                case "SPEED_PCT_5":
                    if (this.scaleType == "shared") {
                        metric_ary.push(this.features[i].properties.SPEED_MED);
                    } else {
                        metric_ary.push(this.features[i].properties.SPEED_PCT_5);
                    };
                    break;
                case "DEVIATION_MED":
                    metric_ary.push(this.features[i].properties.DEVIATION_MED);
                    break;
                case "DEVIATION_STD":
                    metric_ary.push(this.features[i].properties.DEVIATION_STD);
                    break;
                case "TRAVERSALS":
                    metric_ary.push(this.features[i].properties.TRAVERSALS);
                    break;
              };
        };

        // Remove NaN values
        metric_ary = metric_ary.filter(function(value) {
            return !Number.isNaN(value);
        });
        metric_ary = metric_ary.filter(function(value) {
            return value !== undefined;
         });
        return (metric_ary);
    };

    calculateGrades = function() {
        const grades = [];
        const metric_ary = this.getMetricAry();

        if (this.gradient === "equalIntervals") {
            const min = Math.min.apply(Math, metric_ary);
            const max = Math.max.apply(Math, metric_ary);
            const binSize = ((max - min) / this.numBins);
            let current = min;
            for (let i=0; i<this.numBins; i++) {
                let x = Math.round(current*10)/10
                grades.push(x);
                current = current+binSize;
            };
            return (grades);
        } else if (this.gradient === "percentiles") {
            const min = 0.0;
            const max = 1.0;
            const binSize = ((max - min) / this.numBins);
            let current = min;
            for (let i=0; i<this.numBins; i++) {
                let x = quantile(metric_ary, current);
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
        const UNITS = this.getUnits();
        let COLORS = d3ScaleChromatic.schemeRdYlBu[this.numBins];
        const reversed = ["SPEED_STD","DEVIATION_MED","DEVIATION_STD"];

        if (reversed.includes(this.metric)) {
            let reversedCOLORS = [];
            //d3ScaleChromatic does not work well with .reverse() here - do it manually
            for (let i=COLORS.length-1; i>=0; i--) {
                let color = COLORS[i];
                reversedCOLORS.push(color);
            };
            COLORS = reversedCOLORS;
        };

        const legendItemsAry = [];
        for (let i=0; i<this.numBins-1; i++) {
            const legendItem = new LegendItem(
                GRADES[i] + " &ndash; " + GRADES[i+1] + " " + UNITS,
                COLORS[i],
                (metric) => metric < GRADES[i+1]
            );
            legendItemsAry.push(legendItem);
        };

        const lastLegendItem = new LegendItem(
                GRADES[this.numBins-1] + "+" + " " + UNITS,
                COLORS[this.numBins-1],
                (metric) => metric >= GRADES[this.numBins-1]
            );
        legendItemsAry.push(lastLegendItem);

        const undefinedLegendItem = new LegendItem(
                "No Data",
                "#696969",
                (metric) => true
        );
        legendItemsAry.push(undefinedLegendItem);

        return (legendItemsAry);
    };
};

export default LegendItems;