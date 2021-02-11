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
var params = {
    TableName: "KCM_Bus_Routes",
    ProjectionExpression: "compkey, med_speed_m_s"
};

class LoadStreetsTask {
    setState = null;
    load = (setState) => {

        let onScan = (err, data) => {
            if (err) {
                console.error("Unable to scan");
            } else {
                data.Items.forEach(function(street) {
                    segment_ary.push(street.compkey);
                    speed_ary.push(street.med_speed_m_s);
                });
            };
            if (typeof data.LastEvaluatedKey != "undefined") {
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                docClient.scan(params, onScan);
            } else {
                processData();
            };
        };

        let processData = () => {
            for (let i=0; i<features.length; i++) {
                const compkey = features[i].properties.COMPKEY;
                const idx = segment_ary.indexOf(compkey);
                features[i].properties.SPEED = speed_ary[idx].pop();
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