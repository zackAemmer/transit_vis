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
            {'AttributeName': 'vis_id', 'KeyType': 'HASH'},
            {'AttributeName': 'compkey', 'KeyType': 'RANGE'}],
        AttributeDefinitions=[
            {'AttributeName': 'vis_id', 'AttributeType': 'N'},
            {'AttributeName': 'compkey', 'AttributeType': 'N'}],
        ProvisionedThroughput={
            'ReadCapacityUnits': 20,
            'WriteCapacityUnits': 20})
    # Wait until the table exists.
    table.meta.client.get_waiter('table_exists').wait(TableName=table_name)
    return table

def upload_segments_to_dynamo(dynamodb_resource, table_name, kcm_routes):
    """Uploads the segments in a geojson file to a specified dynamodb table.

    Goes thorugh each of the features in a geojson file, and creates a new item
    for that feature on dynamodb. The key is set based on route id and code.
    A field is created for average speed and initialized to 0. An array field
    is created for past speeds and initialized empty. When summarize_rds.py is
    run, it will append the average daily speed to the historic speeds list and
    set the new average speed to that day's speed.

    Args:
        dynamodb_resource: A boto3 Resource pointing to the AWS account on which
            the table should be created.
        table_name: A string containing the name for the segments table.
        kcm_routes: A geojson object containing the features that should be
            uploaded. Each feature must have a [ROUTE_ID] and a [LOCAL_EXPR]
            property. Although this object also contains all of the geometry,
            only the route and segment ids will be uploaded. The Folium map will
            read the speeds from the databse and rejoin them to this file
            locally for display.

    Returns:
        1 when the features are finished uploading to the table.
    """
    table = dynamodb_resource.Table(table_name)
    with table.batch_writer() as batch:
        for route in kcm_routes['features']:
            batch.put_item(
                Item={
                    'vis_id': route['properties']['vis_id'],
                    'compkey': route['properties']['COMPKEY'],
                    'route_id': route['properties']['join_ROUTE_ID'],
                    'local_express_code': route['properties']['join_LOCAL_EXPR'],
                    'route_num': route['properties']['join_ROUTE_NUM'],
                    'dates': [],
                    'speeds_m_s': []})
    return 1

def initialize_dynamodb(geojson_name, dynamodb_table_name):
    """Uploads route segments for a bus network.

    Runs one time to initialize a dynamodb with a set of bus route segments. In
    this case, the network is the King County Metro network. The route shapefile
    can be found at:
    https://www5.kingcounty.gov/sdc/Metadata.aspx?Layer=transitroute.

    Args:
        geojson_name: Path to the geojson file that is to be uploaded. Must have
            [properties][ROUTE_ID] and [properties][LOCAL_EXPR] elements. Do not
            include file type ending (.geojson etc.).
        table_name: A string containing the name for the segments table.

    Returns:
        An integer of the number of features that were uploaded to the
        database.
    """
    with open(f"{geojson_name}.geojson", 'r') as shapefile:
        kcm_routes = json.load(shapefile)

    # Turn all float values (coordinates mostly) into strings in the geojson
    kcm_routes = replace_floats(kcm_routes)

    # Upload the modified segments to a newly created dynamodb table
    print("Connecting to Dynamodb...")
    dynamodb_resource = connect_to_dynamo()
    print("Creating new table...")
    create_dynamo_table(dynamodb_resource, dynamodb_table_name)
    print("Uploading segments to table...")
    upload_segments_to_dynamo(
        dynamodb_resource,
        dynamodb_table_name,
        kcm_routes)

    # Return the number of features that are in the kcm data
    return len(kcm_routes['features'])

if __name__ == "__main__":
    # Main program starts here
    NUM_FEATURES_UPLOADED = initialize_dynamodb(
        './transit_vis/data/kcm_routes',
        'KCM_Bus_Routes_Production')
    print(f"{NUM_FEATURES_UPLOADED} features in data uploaded to dynamodb")
