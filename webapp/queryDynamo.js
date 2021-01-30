var REGION = process.env.REGION;
var ACCESS_ID = process.env.ACCESS_ID;
var ACCESS_KEY = process.env.ACCESS_KEY;

AWS.config.update({
  region: REGION,
  endpoint: 'dynamodb.us-east-2.amazonaws.com',
  accessKeyId: ACCESS_ID,
  secretAccessKey: ACCESS_KEY
});

var docClient = new AWS.DynamoDB.DocumentClient();
var params = {
    TableName: "KCM_Bus_Routes",
    ProjectionExpression: "compkey, med_speed_m_s",
};
var segment_ary = [];
var speed_ary = [];

console.log("Starting scan");
$("#statustext").text("Scanning..");

docClient.scan(params, onScan);

function onScan(err, data) {
    if (err) {
        console.log(err);
    } else {
        data.Items.forEach(function(segment) {
            segment_ary.push(segment.compkey);
            speed_ary.push(segment.med_speed_m_s);
        });
        if (typeof data.LastEvaluatedKey != "undefined") {
            console.log("Scanning again..");
            params.ExclusiveStartKey = data.LastEvaluatedKey;
            docClient.scan(params, onScan);
        } else {
            console.log("Finished scanning");
            console.log(segment_ary);
        }
    }
}