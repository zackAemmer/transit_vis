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
            // Assign the downloaded metrics to street segments
            for (i=0; i<streets.features.length; i++) {
                var COMPKEY = streets.features[i].properties.COMPKEY;
                var idx = segment_ary.indexOf(COMPKEY);
                streets.features[i].properties.SPEED = speed_ary[idx].pop(); // newest speeds at end of list
            };
            // Add the geoJson to the map
            drawGeojson(streets);
        };
    };
};

// Main script starts here
var segment_ary = [];
var speed_ary = [];
var params = {
    TableName: "KCM_Bus_Routes",
    ProjectionExpression: "compkey, med_speed_m_s",
};

docClient.scan(params, onScan);