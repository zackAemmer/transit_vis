import AWS from "aws-sdk";
import {features} from "../data/streets_big.json";
import legendItems from "../entities/LegendItems";

AWS.config.region = "us-east-2";
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: "us-east-2:4e0b1ce8-5ab0-4679-a93f-88c91c151677"
});
var docClient = new AWS.DynamoDB.DocumentClient();
var segment_ary = [];
var speed_ary = [];
var speed_pct_ary = [];
var speed_var_ary = [];
var sch_dev_ary = [];
var num_trav_ary = [];
var params = {
    TableName: "KCM_Bus_Routes",
    ProjectionExpression: "compkey, med_speed_m_s, pct_speed_m_s, var_speed_m_s, med_deviation_s, num_traversals"
};

class LoadStreetsTask {
    setState = null;
    load = (setState) => {

        let onScan = (err, data) => {
            if (err) {
                console.error("Unable to scan");
            } else {
                data.Items.forEach(function(item) {
                    segment_ary.push(item.compkey);
                    speed_ary.push(item.med_speed_m_s);
                    speed_pct_ary.push(item.pct_speed_m_s);
                    speed_var_ary.push(item.var_speed_m_s);
                    sch_dev_ary.push(item.med_deviation_s);
                    num_trav_ary.push(item.num_traversals);
                });
            };
            if (typeof data.LastEvaluatedKey != "undefined") {
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                docClient.scan(params, onScan);
            } else {
                console.log("Scanned Database");
                processData();
            };
        };

        let processData = () => {
            for (let i=0; i<features.length; i++) {
                const compkey = features[i].properties.COMPKEY;
                const idx = segment_ary.indexOf(compkey);
                features[i].properties.SPEED = speed_ary[idx].pop();
                features[i].properties.SPEED_PCT = speed_pct_ary[idx].pop();
                features[i].properties.SPEED_VAR = speed_var_ary[idx].pop();
                features[i].properties.DEVIATION = sch_dev_ary[idx].pop();
                features[i].properties.TRAVERSALS = num_trav_ary[idx].pop();
                this.setStreetColor(features[i]);
            };
            this.setState(features);
        };
        this.setState = setState;
        docClient.scan(params, onScan);
    };

    setStreetColor = (street) => {
        const legendItem = legendItems.find((item) => item.isFor(street.properties.SPEED));
        if (legendItem != null) {
            street.properties.color = legendItem.color;
        };
    };
};

export default LoadStreetsTask;