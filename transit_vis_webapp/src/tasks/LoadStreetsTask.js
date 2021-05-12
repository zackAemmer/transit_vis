import AWS from "aws-sdk";
import {features} from "../data/streets_0001buffer.json";


AWS.config.region = "us-east-2";
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: "us-east-2:4e0b1ce8-5ab0-4679-a93f-88c91c151677"
});
var docClient = new AWS.DynamoDB.DocumentClient();
var segment_ary = [];
var speed_med_ary = [];
var speed_var_ary = [];
var speed_pct_95_ary = [];
var speed_pct_5_ary = [];
var sch_dev_med_ary = [];
var sch_dev_var_ary = [];
var num_trav_ary = [];
var date_ary = [];
var params = {
    TableName: "KCM_Bus_Routes",
    ProjectionExpression: "compkey, med_speed_m_s, var_speed_m_s, pct_speed_95_m_s, pct_speed_5_m_s, med_deviation_s, var_deviation_s, num_traversals, date_updated"
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
                    speed_med_ary.push(item.med_speed_m_s);
                    speed_var_ary.push(item.var_speed_m_s);
                    speed_pct_95_ary.push(item.pct_speed_95_m_s);
                    speed_pct_5_ary.push(item.pct_speed_5_m_s);
                    sch_dev_med_ary.push(item.med_deviation_s);
                    sch_dev_var_ary.push(item.var_deviation_s);
                    num_trav_ary.push(item.num_traversals);
                    date_ary.push(item.date_updated);
                });
            };
            if (typeof data.LastEvaluatedKey != "undefined") {
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                docClient.scan(params, onScan);
            } else {
                console.log("Scanned Database; adding data to features");
                processData();
                console.log("Finished adding data to features");
            };
        };

        let processData = () => {
            for (let i=0; i<features.length; i++) {
                const compkey = features[i].properties.COMPKEY;
                const idx = segment_ary.indexOf(compkey);
                features[i].properties.SPEED_MED_AM = parseFloat(speed_med_ary[idx].AM) * 2.237; //MPH
                features[i].properties.SPEED_MED_PM = parseFloat(speed_med_ary[idx].PM) * 2.237; //MPH
                features[i].properties.SPEED_MED_FULL_DAY = parseFloat(speed_med_ary[idx].FULL_DAY) * 2.237; //MPH

                features[i].properties.PACE_MED_AM = 1 / (parseFloat(speed_med_ary[idx].AM) * 2.237) * 60 * 60; //sec/mi
                features[i].properties.PACE_MED_PM = 1 / (parseFloat(speed_med_ary[idx].PM) * 2.237) * 60 * 60; //sec/mi
                features[i].properties.PACE_MED_FULL_DAY = 1 / (parseFloat(speed_med_ary[idx].FULL_DAY) * 2.237) * 60 * 60; //sec/mi

                features[i].properties.SPEED_STD_AM = Math.sqrt(parseFloat(speed_var_ary[idx].AM));
                features[i].properties.SPEED_STD_PM = Math.sqrt(parseFloat(speed_var_ary[idx].PM));
                features[i].properties.SPEED_STD_FULL_DAY = Math.sqrt(parseFloat(speed_var_ary[idx].FULL_DAY));

                features[i].properties.SPEED_PCT_95_AM = parseFloat(speed_pct_95_ary[idx].AM) * 2.237;
                features[i].properties.SPEED_PCT_95_PM = parseFloat(speed_pct_95_ary[idx].PM) * 2.237;
                features[i].properties.SPEED_PCT_95_FULL_DAY = parseFloat(speed_pct_95_ary[idx].FULL_DAY) * 2.237;

                features[i].properties.SPEED_PCT_5_AM = parseFloat(speed_pct_5_ary[idx].AM) * 2.237;
                features[i].properties.SPEED_PCT_5_PM = parseFloat(speed_pct_5_ary[idx].PM) * 2.237;
                features[i].properties.SPEED_PCT_5_FULL_DAY = parseFloat(speed_pct_5_ary[idx].FULL_DAY) * 2.237;

                features[i].properties.DEVIATION_MED_AM = parseFloat(sch_dev_med_ary[idx].AM);
                features[i].properties.DEVIATION_MED_PM = parseFloat(sch_dev_med_ary[idx].PM);
                features[i].properties.DEVIATION_MED_FULL_DAY = parseFloat(sch_dev_med_ary[idx].FULL_DAY);

                features[i].properties.DEVIATION_STD_AM = Math.sqrt(parseFloat(sch_dev_var_ary[idx].AM));
                features[i].properties.DEVIATION_STD_PM = Math.sqrt(parseFloat(sch_dev_var_ary[idx].PM));
                features[i].properties.DEVIATION_STD_FULL_DAY = Math.sqrt(parseFloat(sch_dev_var_ary[idx].FULL_DAY));

                features[i].properties.TRAVERSALS_AM = parseFloat(num_trav_ary[idx].AM);
                features[i].properties.TRAVERSALS_PM = parseFloat(num_trav_ary[idx].PM);
                features[i].properties.TRAVERSALS_FULL_DAY = parseFloat(num_trav_ary[idx].FULL_DAY);

                features[i].properties.DATE_UPDATED_AM = date_ary[idx].AM;
                features[i].properties.DATE_UPDATED_PM = date_ary[idx].PM;
                features[i].properties.DATE_UPDATED_FULL_DAY = date_ary[idx].FULL_DAY;

            };
            this.setState(features);
        };
        this.setState = setState;
        docClient.scan(params, onScan);
    };
};

export default LoadStreetsTask;