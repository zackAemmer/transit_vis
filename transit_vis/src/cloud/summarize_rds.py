#!/usr/bin/env python3
"""Gathers the last 24hrs of speed data, aggregates it, and uploads it.

This module takes speeds from a SQL data-warehouse and summarizes them to then
upload to the dynamodb database which our visualization draws from. This is
a necessity because querying large (24hrs+) amounts of data from the warehouse
can take upwards of 10 minutes, rendering the tool slow and useless. This script
is run once per day to summarize the daily speeds to the segments created by the
initialize_dynamodb module, however it is also possible to do many days at once.
RAM must be managed carefully to avoid OOM errors, so for a 24hr query at least
3gb is recommended. If using less, the query time period should be split up
smaller than 24hrs.
"""


from datetime import datetime, timezone
import json
import os
import requests
from zipfile import ZipFile

import boto3
import numpy as np
import pandas as pd
import psycopg2
import pytz
from sklearn.neighbors import BallTree

from transit_vis.src import config as cfg


TZ = pytz.timezone('America/Los_Angeles')


def convert_cursor_to_tabular(query_result_cursor):
    """Converts a cursor returned by a SQL execution to a Pandas dataframe.

    First iterates through the cursor and dumps all of the contents into a numpy
    array for easier access. Then, a dataframe is created and grown to store the
    full contents of the cursor. This function's main purpose is to make the
    query results easier to work with in other functions. It may slow down the
    processing especially if extremely large (>24hrs) queries are made.

    Args:
        query_result_cursor: A Psycopg Cursor object pointing to the first
            result from a query for bus locations from the data warehouse. The
            results should contain columns for tripid, vehicleid, orientation,
            scheduledeviation, closeststop, nextstop, locationtime, and
            collectedtime.

    Returns:
        A Pandas Dataframe object containing the query results in tabular
        form.
    """
    # Pull out all the variables from the query result cursor and store in array
    all_tracks = []
    for record in query_result_cursor:
        track = []
        for feature in record:
            track = np.append(track, feature)
        all_tracks.append(track)

    # Convert variables integers, store in Pandas, and return
    daily_results = pd.DataFrame(all_tracks)
    colnames = []
    for col in query_result_cursor.description:
        colnames.append(col.name)
    # If not enough/no data was recorded on the day of interest this will return
    if len(daily_results.columns) == 0:
        return None
    else:
        daily_results.columns = colnames
    daily_results = daily_results.dropna()
    daily_results['tripid'] = daily_results['tripid'].astype(int)
    daily_results['vehicleid'] = daily_results['vehicleid'].astype(int)
    daily_results['orientation'] = daily_results['orientation'].astype(int)
    daily_results['scheduledeviation'] = daily_results['scheduledeviation'].astype(int)
    daily_results['closeststop'] = daily_results['closeststop'].astype(int)
    daily_results['nextstop'] = daily_results['nextstop'].astype(int)
    daily_results['locationtime'] = daily_results['locationtime'].astype(int)
    daily_results['collectedtime'] = daily_results['collectedtime'].astype(int)
    return daily_results

def connect_to_rds():
    """Connects to the RDS data warehouse specified in config.py.

    Attempts to connect to the database, and if successful it returns a
    connection object that can be used for queries to the bus location data.

    Returns:
        A Psycopg Connection object for the RDS data warehouse specified in
        config.py.
    """
    conn = psycopg2.connect(
        host=cfg.HOST,
        database=cfg.DATABASE,
        user=cfg.UID,
        password=cfg.PWD)
    return conn

def get_last_xdays_results(conn, num_days_back, rds_limit):
    """Queries the last x days worth of data from the RDS data warehouse.

    Uses the database connection to execute a query for the last x days of
    bus coordinates stored in the RDS data warehouse. The RDS data must have a
    column for collected time (in epoch format) which is used to determine the
    time. The query is made based on the current system time, so it will count
    x days back from the present on the current system. All time comparisons
    between the RDS and the system are done in epoch time, so there should be no
    concern for time zone differences if running this function from an EC2
    instance.

    Args:
        conn: A Psycopg Connection object for the RDS data warehouse.
        num_days_back: An integer specifying how many days back to start the
            24hr query.
        rds_limit: An integer specifying the maximum number of rows to query.
            Useful for debugging and checking output before making larger
            queries. Set to 0 for no limit.

    Returns:
        A Pandas Dataframe object containing the results in the database for the
        last x day period, and an integer for epoch time of the query end.
    """
    # Query the specified number of days back from current time
    end_time = round(datetime.now().timestamp())
    start_time = end_time - (24*60*60)
    i = 1
    while i < num_days_back:
        end_time = start_time
        start_time = end_time - (24*60*60)
        i += 1
    # Database has index on locationtime attribute
    if rds_limit > 0:
        query_text = f"SELECT * FROM active_trips_study WHERE locationtime " \
            f"BETWEEN {start_time} AND {end_time} LIMIT {rds_limit};"
    else:
        query_text = f"SELECT * FROM active_trips_study WHERE locationtime " \
            f"BETWEEN {start_time} AND {end_time};"
    with conn.cursor() as curs:
        curs.execute(query_text)
        daily_results = convert_cursor_to_tabular(curs)
    return daily_results, start_time

def update_gtfs_route_info():
    """Downloads the latest trip-route conversions from the KCM GTFS feed.

    Connects to the King County Metro GTFS server and requests the latest GTFS
    files. Saves the files in .zip format and then extracts their content to a
    folder named 'google transit'. This will be used when assigning route ids to
    the bus coordinate data from RDS, so that they can then be aggregated to
    matching segments.

    Returns:
        A string with the location of the folder where the GTFS data is saved.
    """
    url = 'http://metro.kingcounty.gov/GTFS/google_transit.zip'
    zip_location = './transit_vis/data/google_transit'
    req = requests.get(url, allow_redirects=True)
    with open('./transit_vis/data/google_transit.zip', 'wb') as g_file:
        g_file.write(req.content)
    with ZipFile('./transit_vis/data/google_transit.zip', 'r') as zip_obj:
        zip_obj.extractall('./transit_vis/data/google_transit')
    return zip_location

def preprocess_trip_data(daily_results):
    """Cleans the tabular trip data and calculates average speed.

    Removes rows with duplicated tripid, locationid columns from the data. These
    rows are times where the OneBusAway API was queried faster than the bus
    location was updated, creating duplicate info. Buses update at around 30s
    intervals and the API is queried at 10s intervals so there is a large amount
    of duplicate data. Speeds are calculated between consecutive bus locations
    based on the distance traveled and the time between those locations. Speeds
    that are below 0 m/s, or above 30 m/s are assumed to be GPS multipathing or
    other recording errors and are removed. Deviation change indicates an
    unexpected delay manifested as a change in schedule deviation. Stop delay is
    true if the nextstop attribute changed from the previous location.

    Args:
        daily_results: A Pandas Dataframe object containing bus location, time,
            and other RDS data.

    Returns:
        A Pandas Dataframe object containing the cleaned set of results with an
        additional column named 'avg_speed_m_s', another column named 
        'deviation_change_s' and another named 'at_stop'.
    """
    # Remove duplicate trip locations
    daily_results.drop_duplicates(subset=['tripid', 'locationtime'], inplace=True)
    daily_results.sort_values(by=['tripid', 'locationtime'], inplace=True)

    # Offset tripdistance, locationtime, and tripids by 1
    daily_results['prev_tripdistance'] = 1
    daily_results['prev_locationtime'] = 1
    daily_results['prev_deviation'] = 1
    daily_results['prev_tripid'] = 1
    daily_results['prev_stopid'] = 1
    daily_results['prev_tripdistance'] = daily_results['tripdistance'].shift(1)
    daily_results['prev_locationtime'] = daily_results['locationtime'].shift(1)
    daily_results['prev_deviation'] = daily_results['scheduledeviation'].shift(1)
    daily_results['prev_tripid'] = daily_results['tripid'].shift(1)
    daily_results['prev_stopid'] = daily_results['nextstop'].shift(1)

    # Remove NA rows, and rows where tripid is different (last recorded location)
    daily_results.loc[daily_results.tripid != daily_results.prev_tripid, 'tripid'] = None
    daily_results.dropna(inplace=True)

    # Calculate average speed between each location bus is tracked at
    daily_results.loc[:, 'dist_diff'] = daily_results['tripdistance'] \
        - daily_results['prev_tripdistance']
    daily_results.loc[:, 'time_diff'] = daily_results['locationtime'] \
        - daily_results['prev_locationtime']
    daily_results.loc[:, 'avg_speed_m_s'] = daily_results['dist_diff'] \
        / daily_results['time_diff']

    # Calculate change in schedule deviation
    daily_results.loc[:, 'deviation_change_s'] = daily_results['scheduledeviation'] \
        - daily_results['prev_deviation']

    # Find rows where the delay/speed incorporated a transit stop (nextstop changed)
    daily_results.loc[daily_results['nextstop'] != daily_results['prev_stopid'], 'at_stop'] = True
    daily_results.loc[daily_results['nextstop'] == daily_results['prev_stopid'], 'at_stop'] = False

    # Remove rows where speed is below 0 or above 30 and round
    daily_results = daily_results[daily_results['avg_speed_m_s'] >= 0]
    daily_results = daily_results[daily_results['avg_speed_m_s'] <= 30]
    daily_results.loc[:, 'avg_speed_m_s'] = round(
        daily_results.loc[:, 'avg_speed_m_s'])

    # Remove rows where schedule deviation change is below -600 or above 300 (5mins)
    daily_results = daily_results[daily_results['deviation_change_s'] >= -300]
    daily_results = daily_results[daily_results['deviation_change_s'] <= 300]
    daily_results.loc[:, 'deviation_change_s'] = round(
        daily_results.loc[:, 'deviation_change_s'])

    # Merge scraped data with the gtfs data to get route ids
    gtfs_trips = pd.read_csv('./transit_vis/data/google_transit/trips.txt')
    gtfs_trips = gtfs_trips[['route_id', 'trip_id', 'trip_short_name']]
    gtfs_routes = pd.read_csv('./transit_vis/data/google_transit/routes.txt')
    gtfs_routes = gtfs_routes[['route_id', 'route_short_name']]
    daily_results = daily_results.merge(
        gtfs_trips,
        left_on='tripid',
        right_on='trip_id')
    daily_results = daily_results.merge(
        gtfs_routes,
        left_on='route_id',
        right_on='route_id')
    return daily_results

def get_nearest(src_points, candidates):
    """Find nearest neighbors for all source points from a set of candidates.

    Taken from:
    https://automating-gis-processes.github.io/site/notebooks/L3/nearest-neighbor-faster.html
    Uses a BallTree implementation from sklearn to find closest points between a
    list of source and candidate points in an efficient manner. Uses Haversine
    (great sphere) distance, which means points should be in lat/lon coordinate
    format.

    Args:
        src_points: A Pandas Dataframe consisting of 2 columns named 'lat' and
            'lon'. Each row is a bus coordinate to be assigned.
        candidates: A Pandas Dataframe consisting of 2 columns named 'lat' and
            'lon'. Each row is a point within a segment on a bus route.

    Returns:
        A tuple with 2 lists; the first contains the index of the closest
        candidate point to each source point, the second contains the distance
        between those points.
    """
    # Create tree from the candidate points
    tree = BallTree(candidates, leaf_size=15, metric='haversine')

    # Find closest points and distances
    distances, indices = tree.query(src_points, k=1)

    # Transpose to get distances and indices into arrays
    distances = distances.transpose()
    indices = indices.transpose()

    # Get closest indices and distances (i.e. array at index 0)
    # note: for the second closest points, you would take index 1, etc.
    closest_idx = indices[0]
    closest_dist = distances[0]
    return (closest_idx, closest_dist)

def assign_results_to_segments(kcm_routes, daily_results):
    """Assigns each of the bus locations from the RDS to the closest segment.

    Assigns each location that a bus was tracked at to its closest segment by
    using the get_nearest function to calculate distances between bus locations
    and points on segments in the routes geojson. A bus location can only be
    assigned to a line segment from the route that it belongs to.

    Args:
        kcm_routes: A geojson file (generated during initialize_dynamodb.py)
            that contains features for each segment in the bus network.
        daily_results: A Pandas Dataframe containing the preprocessed data
            queried from the RDS data warehouse.

    Returns:
        A Pandas Dataframe containing the bus location data passed with
        additional columns for the closest route and segment ids.
    """
    # Convert segment data from json format to tabular
    # vis_id is unique id, route_id helps narrow down when matching segments
    feature_coords = []
    feature_lengths = []
    vis_ids = []
    compkeys = []
    route_ids = []
    for feature in kcm_routes['features']:
        assert feature['geometry']['type'] == 'MultiLineString'
        for coord_pair in feature['geometry']['coordinates'][0]:
            feature_coords.append(coord_pair)
            feature_lengths.append(feature['properties']['SEGLENGTH'])
            vis_ids.append(feature['properties']['vis_id'])
            compkeys.append(feature['properties']['COMPKEY'])
            route_ids.append(feature['properties']['join_ROUTE_ID'])
    segments = pd.DataFrame()
    segments['route_id'] = route_ids
    segments['vis_id'] = vis_ids
    segments['compkey'] = compkeys
    segments['length'] = feature_lengths
    segments['lat'] = np.array(feature_coords)[:,0]
    segments['lon'] = np.array(feature_coords)[:,1]

    # Find closest segment that shares route for each tracked location
    to_upload = pd.DataFrame()
    route_list = pd.unique(daily_results['route_id'])
    untracked = []
    for route in route_list:
        route_results = daily_results[daily_results['route_id']==route]
        route_segments = segments[segments['route_id']==route].reset_index()
        if len(route_results) > 0 and len(route_segments) > 0:
            result_idxs, result_dists = get_nearest(route_results[['lat', 'lon']], 
                                                   route_segments[['lat', 'lon']])
            route_results = route_results.reset_index().join(route_segments.loc[result_idxs,:].reset_index(), rsuffix='_seg')
            to_upload = to_upload.append(route_results)
        else:
            untracked.append(route)
            result_idxs = -1
            result_dists = -1
    print(f"Routes {untracked} are either not tracked, or do not have an id in the KCM shapefile")

    # Clean up the results columns
    columns_to_keep = [
        # From the database and its offsets
        'tripid',
        'vehicleid',
        'lat',
        'lon',
        'orientation',
        'scheduledeviation',
        'prev_deviation',
        'totaltripdistance',
        'tripdistance',
        'prev_tripdistance',
        'closeststop',
        'nextstop',
        'prev_stopid',
        'locationtime',
        'prev_locationtime',
        # Calculated from database values
        'dist_diff',
        'time_diff',
        'avg_speed_m_s',
        'deviation_change_s',
        'at_stop',
        # From joining GTFS
        'route_id',
        'trip_short_name',
        'route_short_name',
        # From joining nearest kcm segments
        'vis_id',
        'compkey',
        'length',
        'lat_seg',
        'lon_seg']
    to_upload = to_upload[columns_to_keep]
    return to_upload

def connect_to_dynamo_table(table_name):
    """Connects to the dynamodb table specified using details from config.py.

    Uses the AWS login information stored in config.py to attempt a connection
    to dynamodb using the boto3 library, then creates a connection to the
    specified table.

    Args:
        table_name: The name of the table on the dynamodb resource to connect.

    Returns:
        A boto3 Table object pointing to the dynamodb table specified.
    """
    dynamodb = boto3.resource(
        'dynamodb',
        region_name=cfg.REGION,
        aws_access_key_id=cfg.ACCESS_ID,
        aws_secret_access_key=cfg.ACCESS_KEY)
    table = dynamodb.Table(table_name)
    return table

def upload_to_dynamo(dynamodb_table, to_upload, end_time):
    """Uploads the speeds gathered and processed from the RDS to dynamodb.

    Groups all bus speed observations by route/segment ids and averages the
    observed speeds. Uploads the results to dynamodb; replaces avg_speed_m_s
    with the latest value, and appends to historic_speeds which keeps track of
    past average daily speeds for each segment.

    Args:
        dynamodb_table: A boto3 Table pointing to a dynamodb table that has been
            initialized to contain the same segments as to_upload.
        to_upload: A Pandas Dataframe to be uploaded to dynamodb containing
            route ids, and their average speeds.
        end_time: An epoch time integer that represents the date to assign the
            values to.

    Returns:
        The length of the to_upload argument.
    """
    # Get formatted date to assign to speed data
    collection_date = datetime.utcfromtimestamp(end_time).replace(tzinfo=pytz.utc).astimezone(TZ).strftime('%m_%d_%Y')
    # Aggregate the observed bus speeds by their ids
    to_upload = to_upload[['vis_id', 'route_id', 'avg_speed_m_s', 'deviation_change_s']]
    to_upload = to_upload.groupby(['vis_id', 'route_id']).agg(['mean', 'var', 'count']).reset_index()
    # Round all calculated means and variances
    to_upload[('avg_speed_m_s', 'mean')] = round(to_upload[('avg_speed_m_s', 'mean')], 1)
    to_upload[('avg_speed_m_s', 'var')] = round(to_upload[('avg_speed_m_s', 'var')], 1)
    to_upload[('deviation_change_s', 'mean')] = round(to_upload[('deviation_change_s', 'mean')], 1)
    to_upload[('deviation_change_s', 'var')] = round(to_upload[('deviation_change_s', 'var')], 1)
    to_upload = to_upload.to_dict(orient='records')
    # Update each route/segment id in the dynamodb with its new value
    for segment in to_upload:
        dynamodb_table.update_item(
            Key={
                'vis_id': segment[('vis_id', '')],
                'route_id': segment[('route_id', '')]},
            UpdateExpression="SET record_date=list_append(if_not_exists(record_date, :empty_list), :date_val)," \
                "mean_speed_m_s=list_append(if_not_exists(mean_speed_m_s, :empty_list), :mean_speed_val)," \
                "var_speed_m_s=list_append(if_not_exists(var_speed_m_s, :empty_list), :var_speed_val)," \
                "mean_deviation_s=list_append(if_not_exists(mean_deviation_s, :empty_list), :mean_deviation_val)," \
                "var_deviation_s=list_append(if_not_exists(var_deviation_s, :empty_list), :var_deviation_val)," \
                "sample_size=list_append(if_not_exists(sample_size, :empty_list), :size_val)",
            ExpressionAttributeValues={
                ':date_val': [str(collection_date)],
                ':mean_speed_val': [str(segment[('avg_speed_m_s', 'mean')])],
                ':var_speed_val': [str(segment[('avg_speed_m_s', 'var')])],
                ':mean_deviation_val': [str(segment[('deviation_change_s', 'mean')])],
                ':var_deviation_val': [str(segment[('deviation_change_s', 'var')])],
                ':size_val': [str(segment[('avg_speed_m_s', 'count')])],
                ':empty_list': []})
    return len(to_upload)

def summarize_rds(dynamodb_table_name, num_days, rds_limit, save_locally):
    """Queries 24hrs of data from RDS, calculates speeds, and uploads them.

    Runs daily to take 24hrs worth of data stored in the data warehouse
    and summarize it for usage with the Folium map. Speeds for each observed
    bus location are calculated using consecutive trip distances and times.The
    geojson segments used are generated during initialize_dynamodb.py, which
    guarantees that they will be the same ones that are stored on the dynamodb
    database, allowing for this script to upload them. The Folium map will then
    download the speeds and display them using the same geojson file once again.

    Args:
        dynamodb_table_name: The name of the table containing the segments that
            speeds will be matched and uploaded to.
        num_days: How many days back data should be queried from RDS to be added
            to the dynamodb database. Helpful for quickly populating dynamodb
            with speeds when first setting it up. Set to 1 to use last 24hrs of
            data.
        rds_limit: An integer specifying the maximum number of rows to query.
            Useful for debugging and checking output before making larger
            queries. Set to 0 for no limit.
        save_locally: Boolean specifying whether to save the processed data to
            a folder on the user's machine.

    Returns:
        An integer of the number of segments that were updated in the
        database.
    """
    # Update the current gtfs trip-route info from King County Metro
    print("Updating the GTFS files...")
    update_gtfs_route_info()

    # Load 24hrs of scraped data, return if there is no data found, process otherwise
    print("Connecting to RDS...")
    conn = connect_to_rds()
    print("Querying data from RDS (~5mins if no limit specified)...")
    daily_results, start_time = get_last_xdays_results(conn, num_days, rds_limit)
    if daily_results is None:
        print(f"No results found for {start_time}")
        return 0
    print("Processing queried RDS data...")
    daily_results = preprocess_trip_data(daily_results)

    # Load the route segments shapefile
    with open('./transit_vis/data/kcm_routes.geojson') as shapefile:
        kcm_routes = json.load(shapefile)

    # Find the closest segment w/matching route for each speed in daily results
    print("Matching speeds to segments...")
    daily_results = assign_results_to_segments(kcm_routes, daily_results)

    # Save the processed data for the user as .csv if specified
    if save_locally:
        outdir = "./transit_vis/data/to_upload"
        outfile = datetime.utcfromtimestamp(start_time).replace(tzinfo=pytz.utc).astimezone(TZ).strftime('%m_%d_%Y')
        if not os.path.exists(outdir):
            os.mkdir(outdir)
        print("Saving processed speeds to data folder...")
        daily_results.to_csv(f"{outdir}/{outfile}.csv", index=False)

    # Upload to dynamoDB
    print("Uploading aggregated segment data to dynamoDB...")
    table = connect_to_dynamo_table(dynamodb_table_name)
    upload_length = upload_to_dynamo(table, daily_results, start_time)
    return upload_length

if __name__ == "__main__":
    for x in range(28, 65):
        print(x)
        NUM_SEGMENTS_UPDATED = summarize_rds(
            dynamodb_table_name='KCM_Bus_Routes_Production',
            num_days=x,
            rds_limit=0,
            save_locally=True)
        print(f"Number of segments updated: {NUM_SEGMENTS_UPDATED}")
