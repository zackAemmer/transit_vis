// Connect to AWS Cognito to get read-only dynamodb credentials
AWS.config.region = "us-east-2";
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: "us-east-2:4e0b1ce8-5ab0-4679-a93f-88c91c151677"
});
var docClient = new AWS.DynamoDB.DocumentClient();

// Function that repeatedly scans all records in dynamo 1MB per scan
function onScan(err, data) {
console.log("Starting scan");
    if (err) {
        console.log("Error occurred");
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
};

// Main script starts here
var segment_ary = [];
var speed_ary = [];
var params = {
    TableName: "KCM_Bus_Routes",
    ProjectionExpression: "compkey, med_speed_m_s",
};
$("#statustext").text("Scanning..");
docClient.scan(params, onScan);