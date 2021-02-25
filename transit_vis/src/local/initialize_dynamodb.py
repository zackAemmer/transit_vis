"""Builds a network from individual bus routes and uploads them.

This module is intended to be run as a setup prior to using the visualization
tool. It takes a geojson file with complete bus routes and uploads them to
a dynamodb database. Once this has been done, the summarize_rds.py module can
aggregate bus speeds to each route, and transit_vis can plot them on a map.
"""


import json

import boto3

from transit_vis.src import config as cfg


def replace_floats(obj):
    """Replaces all data types of a nested structure with strings.

    Dynamodb does not support float values, which will potentially cause
    problems with lat/lon and other long decimals. This function works with json
    styled nested objects to convert all values to strings for uploading.

    Args:
        obj: Object with nested dict/list values to convert to strings.

    Returns:
        The same object that was passed, but with all values changed to strings.
    """
    if isinstance(obj, list):
        for i, _ in enumerate(obj):
            obj[i] = replace_floats(obj[i])
        return obj
    if isinstance(obj, dict):
        for k in obj.keys():
            obj[k] = replace_floats(obj[k])
        return obj
    if isinstance(obj, float):
        return str(obj)
    return obj

def connect_to_dynamo():
    """Connects to the dynamodb resource specified in config.py.

    Uses the AWS login information stored in config.py to attempt a connection
    to dynamodb using the boto3 library.

    Returns:
        A boto3 Resource object pointing to dynamodb for the specified
        AWS account.
    """
    dynamodb = boto3.resource(
        'dynamodb',
        region_name=cfg.REGION,
        aws_access_key_id=cfg.ACCESS_ID,
        aws_secret_access_key=cfg.ACCESS_KEY)
    return dynamodb

def create_dynamo_table(dynamodb_resource, table_name):
    """Creates a new table for segments on a specified dynamodb resource.

    Creates a table with the specified name on the specified dynamodb resource.
    The keys are set as route id and express code, which should identify any
    unique route in the dataset. Read/write capacity is limited to 20/sec to
    stay within the AWS free-tier. This is necessary but greatly slows down the
    upload process when using a large number of routes.

    Args:
        dynamodb_resource: A boto3 Resource pointing to the AWS account on which
            the table should be created.
        table_name: A string containing the name for the segments table.

    Returns:
        A boto3 Table object pointing to the newly created segments table.
    """
    table = dynamodb_resource.create_table(
        TableName=table_name,
        KeySchema=[
            {'AttributeName': 'compkey', 'KeyType': 'HASH'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'compkey', 'AttributeType': 'N'}
        ],
        ProvisionedThroughput={
            'ReadCapacityUnits': 20,
            'WriteCapacityUnits': 20}
    )
    # Wait until the table exists.
    table.meta.client.get_waiter('table_exists').wait(TableName=table_name)
    return table

def upload_segments_to_dynamo(dynamodb_resource, table_name, segments):
    """Uploads the segments in a geojson file to a specified dynamodb table.

    Goes thorugh each of the features in a geojson file, and creates a new item
    for that feature on dynamodb. The key is set based on route id and code.
    Fields for variables of interest are initialized to empty arrays.

    Args:
        dynamodb_resource: A boto3 Resource pointing to the AWS account on which
            the table should be created.
        table_name: A string containing the name for the segments table.
        segments: A geojson object containing the features that should be
            uploaded. Although this object also contains all of the geometry,
            only the ids will be uploaded.

    Returns:
        1 when the features are finished uploading to the table.
    """
    table = dynamodb_resource.Table(table_name)
    with table.batch_writer() as batch:
        for segment in segments['features']:
            batch.put_item(
                Item={
                    'compkey': segment['properties']['COMPKEY'],
                    'med_speed_m_s': [],
                    'var_speed_m_s': [],
                    'pct_speed_95_m_s': [],
                    'pct_speed_5_m_s': [],
                    'med_deviation_s': [],
                    'var_deviation_s': [],
                    'num_traversals': [],
                    'date_updated': []
                })
    return 1

def initialize_dynamodb(geojson_name, dynamodb_table_name):
    """Uploads route segments for a bus network.

    Runs one time to initialize a dynamodb with a set of bus route segments. In
    this case, the network is the King County Metro network. The route shapefile
    can be found at:
    https://www5.kingcounty.gov/sdc/Metadata.aspx?Layer=transitroute.

    Args:
        geojson_name: Path to the geojson file that is to be uploaded. Do not
            include file type ending (.geojson etc.).
        table_name: A string containing the name for the segments table.

    Returns:
        An integer of the number of features that were uploaded to the
        database.
    """
    with open(f"{geojson_name}.geojson", 'r') as shapefile:
        segments = json.load(shapefile)

    # Turn all float values (coordinates mostly) into strings in the geojson
    segments = replace_floats(segments)

    # Upload the modified segments to a newly created dynamodb table
    print("Connecting to Dynamodb...")
    dynamodb_resource = connect_to_dynamo()
    print("Creating new table...")
    create_dynamo_table(dynamodb_resource, dynamodb_table_name)
    print("Uploading segments to table...")
    upload_segments_to_dynamo(
        dynamodb_resource,
        dynamodb_table_name,
        segments)
    # Return the number of features that are in the kcm data
    return len(segments['features'])

if __name__ == "__main__":
    # Main program starts here
    NUM_FEATURES_UPLOADED = initialize_dynamodb(
        './transit_vis/data/streets_0002buffer',
        'KCM_Bus_Routes')
    print(f"{NUM_FEATURES_UPLOADED} features in data uploaded to dynamodb")
