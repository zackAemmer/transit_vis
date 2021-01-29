AWS.config.update({
  region: REGION,
  endpoint: 'dynamodb.us-east-2.amazonaws.com',
  // accessKeyId default can be used while using the downloadable version of DynamoDB. 
  // For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
  accessKeyId: ACCESS_ID,
  // secretAccessKey default can be used while using the downloadable version of DynamoDB. 
  // For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
  secretAccessKey: ACCESS_KEY
});

var docClient = new AWS.DynamoDB.DocumentClient();

function scanData() {
    document.getElementById('textarea').innerHTML += "Scanning table." + "\n";

    var params = {
        TableName: "KCM_Bus_Routes",
        ProjectionExpression: "compkey, med_speed_m_s",
    };

    docClient.scan(params, onScan);

    function onScan(err, data) {
        if (err) {
            document.getElementById('textarea').innerHTML += "Unable to scan the table: " + "\n" + JSON.stringify(err, undefined, 2);
        } else {
            // Print all the movies
            document.getElementById('textarea').innerHTML += "Scan succeeded. " + "\n";
            data.Items.forEach(function(segment) {
                document.getElementById('textarea').innerHTML += segment.compkey + "\n";
            });

            // Continue scanning if we have more movies (per scan 1MB limitation)
            document.getElementById('textarea').innerHTML += "Scanning for more..." + "\n";
            params.ExclusiveStartKey = data.LastEvaluatedKey;
            docClient.scan(params, onScan);            
        }
    }
}