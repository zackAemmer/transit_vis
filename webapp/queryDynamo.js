AWS.config.update({
    region: 'us-east-1',
    endpoint: 'dynamodb.us-eas-2.amazonaws.com',
    credentials: new AWS.CognitoIdentityCredentials({
      AccountId: '476220055377',
      RoleArn: 'arn:aws:iam::476220055377:role/Cognito_Transit_VisUnauth_Role',
      IdentityPoolId: 'us-east-1:ddba1821-963b-4ed3-9cd9-dd9fd7693bd4'
    })
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