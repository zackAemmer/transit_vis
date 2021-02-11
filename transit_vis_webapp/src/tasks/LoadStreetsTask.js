import AWS from "aws-sdk";
import {features} from "../data/streets_big.json";

AWS.config.region = "us-east-2";
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: "us-east-2:4e0b1ce8-5ab0-4679-a93f-88c91c151677"
});
var docClient = new AWS.DynamoDB.DocumentClient();

class LoadStreetsTask {
    setState = null;
    load = (setState) => {
        this.setState = setState;
        var segment_ary = [];
        var speed_ary = [];
        var params = {
            TableName: "KCM_Bus_Routes",
            ProjectionExpression: "compkey, med_speed_m_s",
        };
        function onScan(err, data) {
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
                this.#processData(segment_ary, speed_ary);
            };
        };
        docClient.scan(params, onScan);
    };

    #processData = (segment_ary, speed_ary) => {
        for (let i=0; i<features.length; i++) {
            const compkey = features[i].properties.COMPKEY;
            const idx = segment_ary.indexOf(compkey);
            features[i].properties.SPEED = speed_ary[idx].pop();
        };
    };
};

export default LoadStreetsTask;