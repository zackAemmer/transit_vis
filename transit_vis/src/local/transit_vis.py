#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# pylint: disable=E1101
# pylint: disable=E0611
# pylint: disable=E0401
"""Gathers data from dynamodb database and plots it to a Folium Map for display.

This is the main component of the visualization tool. It first gathers data on
all of the segment stored in the dynamodb, then constructs a Folium map which
contains both the route segments and census tract-level socioeconomic data taken
from the American Community Survey. The map is saved as an html file to open
in a web browser.
"""

import os
import json

import boto3
import branca.colormap as cm
import folium
from folium.plugins import FloatImage
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from transit_vis.src import config as cfg


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

def dump_table(dynamodb_table):
    """Downloads the contents of a dynamodb table and returns them as a list.

    Iterates through the contents of a dynamodb scan() call, which returns a
    LastEvaluatedKey until there are no results left in the scan. Appends each
    chunk of data returned by scan to an array for further use.

    Args:
        dynamodb_table: A boto3 Table object from which all data will be read
            into memory and returned.

    Returns:
        A list of items downloaded from the dynamodb table. In this case, each
        item is a bus route as generated in initialize_db.py.
    """
    result = []
    response = dynamodb_table.scan()
    result.extend(response['Items'])
    while 'LastEvaluatedKey' in response.keys():
        response = dynamodb_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        result.extend(response['Items'])
    return result

def table_to_lookup(table):
    """Converts the contents of a dynamodb table to a dictionary for reference.

    Uses dump_table to download the contents of a specified table, then creates
    a route lookup dictionary where each key is (route id, express code) and
    contains elements for avg_speed, and historic_speeds.

    Args:
        table: A boto3 Table object from which all data will be read
            into memory and returned.

    Returns:
        A dictionary with (route id, segment id) keys and average speed (num),
        historic speeds (list), and local express code (str) data.
    """
    # Put the data in a dictionary to reference when adding speeds to geojson
    items = dump_table(table)
    route_lookup = {}
    for item in items:
        if 'avg_speed_m_s' in item.keys():
            route_id = int(item['route_id'])
            local_express_code = item['local_express_code']
            hist_speeds = [float(i) for i in item['historic_speeds']]
            route_lookup[(route_id, local_express_code)] = {
                'avg_speed_m_s': float(item['avg_speed_m_s']),
                'historic_speeds': hist_speeds
            }
    return route_lookup

def write_census_data_to_csv(s0801_path, s1902_path, tract_shapes_path):
    """Writes the data downloaded directly from ACS to TIGER shapefiles.

    Reads in data from .csv format as downloaded from the American Community
    Survey (ACS) website, then filters to variables of interest and saves. In
    this case the two tables are s0801 and s1902, which contain basic
    socioeconomic and commute-related variables. Data was downloaded at the
    census tract level for the state of Washington. The data is saved in .csv
    format to be used in the Folium map.

    Args:
        s0801_path: A string path to the location of the raw s0801 data, not
            including file type ending (.csv).
        s1902_path: A string path to the location of the raw s1902 data, not
            including file type ending (.csv).
        tract_shapes_path: A string path to the geojson TIGER shapefile as
            downloaded from the ACS, containing polygon data for census tracts
            in the state of Washington.

    Returns:
        1 after writing the combined datasets to a *_tmp file in the same folder
        as the TIGER shapefiles.
    """
    # Read in the two tables that were taken from the ACS data portal website
    s0801_df = pd.read_csv(f"{s0801_path}.csv")
    s1902_df = pd.read_csv(f"{s1902_path}.csv")
    # Filter each table to only variables of interest, make more descriptive
    commuters_df = s0801_df[[
        'GEO_ID', 'NAME',
        'S0801_C01_001E', 'S0801_C01_009E']]
    commuters_df.columns = [
        'GEO_ID', 'NAME',
        'total_workers', 'workers_using_transit']
    commuters_df = commuters_df.loc[1:len(commuters_df), :]
    commuters_df['GEO_ID'] = commuters_df['GEO_ID'].str[-11:]

    # Repeat for s1902
    households_df = s1902_df[[
        'GEO_ID', 'NAME', 'S1902_C01_001E',
        'S1902_C03_001E', 'S1902_C02_008E',
        'S1902_C02_020E', 'S1902_C02_021E']]
    households_df.columns = [
        'GEO_ID', 'NAME', 'total_households',
        'mean_income', 'percent_w_assistance',
        'percent_white', 'percent_black_or_african_american']
    households_df = households_df.loc[1:len(households_df), :]
    households_df['GEO_ID'] = households_df['GEO_ID'].str[-11:]

    # Combine datasets on their census tract ID and write to .csv file
    final_df = pd.merge(commuters_df, households_df, on='GEO_ID').drop(columns=['NAME_x', 'NAME_y'])
    final_df.to_csv(f"{tract_shapes_path}_tmp.csv", index=False)
    return 1

def write_speeds_to_map_segments(speed_lookup, segment_path):
    """Creates a _tmp geojson file with speed data downloaded from dynamodb.

    Loads the segments generated from initialize_db.py and adds speeds to them
    based on the specified dictionary. Writes a new *_tmp geojson file that will
    be loaded by the Folium map and color coded based on segment average speed.

    Args:
        speed_lookup: A Dictionary object with (route id, local_express_code)
            keys and average speed data to be plotted by Folium.
        segment_path: A string path to the geojson file generated by
            initialize_db.py that contains route coordinate data.

    Returns:
        A list containing the average speed of each segment that was
        successfully paired to a route (and will be plotted on the map).
    """
    if isinstance(speed_lookup, dict):
        pass
    else:
        raise TypeError('Speed lookup must be a dictionary')
    # Read route geojson, add property for avg speed, keep track of all speeds
    speeds = np.ones(0)
    with open(f"{segment_path}.geojson", 'r') as shapefile:
        kcm_routes = json.load(shapefile)
    # Check if each geojson feature has a speed in the database
    for feature in kcm_routes['features']:
        route_id = feature['properties']['ROUTE_ID']
        local_express_code = feature['properties']['LOCAL_EXPR']
        if (route_id, local_express_code) in speed_lookup.keys():
            speed = speed_lookup[(route_id, local_express_code)]['avg_speed_m_s']
            feature['properties']['AVG_SPEED_M_S'] = speed
            feature['properties']['HISTORIC_SPEEDS'] = \
                speed_lookup[(route_id, local_express_code)]['historic_speeds']
            speeds = np.append(speeds, speed)
        else:
            feature['properties']['AVG_SPEED_M_S'] = 0
            feature['properties']['HISTORIC_SPEEDS'] = [0]
    # Plot and save the distribution of speeds to be plotted with Folium
    plt.figure(figsize=(4, 2.5))
    plt.style.use('seaborn')
    plt.hist(speeds[np.nonzero(speeds)], bins=15)
    plt.xlim((0, 30))
    plt.title('Network Speeds')
    plt.xlabel('Average Speed (m/s)')
    plt.ylabel('Count of Routes')
    plt.savefig(f"{segment_path}_histogram.png", bbox_inches='tight')
    # Write the downloaded speeds to temp file to be plotted with Folium
    with open(f"{segment_path}_w_speeds_tmp.geojson", 'w+') as new_shapefile:
        json.dump(kcm_routes, new_shapefile)
    return speeds

def generate_folium_map(segment_file, census_file, colormap):
    """Draws together speed/socioeconomic data to create a Folium map.

    Loads segments with speed data, combined census data, and the colormap
    generated from the list of speeds to be plotted. Plots all data sources on
    a new Folium Map object centered on Seattle, and returns the map.

    Args:
        segment_file: A string path to the geojson file generated by
            write_speeds_to_map_segments that should contain geometry as well
            as speed data.
        census_file: A string path to the geojson file generated by
            write_census_data_to_csv that should contain the combined s0801 and
            s1902 tables.
        colormap: A Colormap object that describes what speeds should be mapped
            to what colors.

    Returns:
        A Folium Map object containing the most up-to-date speed data from the
        dynamodb.
    """
    # Read in route shapefile and give it styles
    kcm_routes = folium.GeoJson(
        name='King Country Metro Speed Data',
        data=f"{segment_file}_w_speeds_tmp.geojson",
        style_function=lambda feature: {
            'color': 'gray' if feature['properties']['AVG_SPEED_M_S'] == 0 \
                else colormap(feature['properties']['AVG_SPEED_M_S']),
            'weight': 1 if feature['properties']['AVG_SPEED_M_S'] == 0 \
                else 3},
        highlight_function=lambda feature: {
            'fillColor': '#ffaf00', 'color': 'blue', 'weight': 6},
        tooltip=folium.features.GeoJsonTooltip(
            fields=['ROUTE_NUM', 'AVG_SPEED_M_S',
                    'ROUTE_ID', 'LOCAL_EXPR', 'HISTORIC_SPEEDS'],
            aliases=['Route Number', 'Most Recent Speed (m/s)',
                     'Route ID', 'Local (L) or Express (E)', 'Previous Speeds']))
    # Read in the census data/shapefile and create a choropleth based on income
    seattle_tracts_df = pd.read_csv(f"{census_file}_tmp.csv")
    seattle_tracts_df['GEO_ID'] = seattle_tracts_df['GEO_ID'].astype(str)
    seattle_tracts_df['mean_income'] = pd.to_numeric(\
                                         seattle_tracts_df['mean_income'],\
                                         errors='coerce')
    seattle_tracts_df = seattle_tracts_df.dropna()
    seattle_tracts = folium.Choropleth(
        geo_data=f"{census_file}.geojson",
        name='Socioeconomic Data',
        data=seattle_tracts_df,
        columns=['GEO_ID', 'mean_income'],
        key_on='feature.properties.GEOID10',
        fill_color='PuBu',
        fill_opacity=0.7,
        line_opacity=0.4,
        legend_name='Mean Income (usd)')
    # Read in histogram images for citywide speeds and arrange them on map
    histogram_figs = FloatImage(
        f"{segment_file}_histogram.png",
        bottom=0,
        left=0)
    # Draw map using the speeds and census data
    f_map = folium.Map(
        location=[47.606209, -122.332069],
        zoom_start=11,
        prefer_canvas=True)
    seattle_tracts.add_to(f_map)
    kcm_routes.add_to(f_map)
    histogram_figs.add_to(f_map)
    colormap.caption = 'Average Speed (m/s)'
    colormap.add_to(f_map)
    folium.LayerControl().add_to(f_map)
    return f_map

def save_and_view_map(f_map, output_path):
    """Writes Folium Map to an output file and prints the path to the terminal.

    Saves the specified Folium Map to the specified location. File is saved as
    an .html file. The user can then open the path in any browser to display
    it.

    Args:
        f_map: A Folium Map object to be written.
        output_path: A string path to the location where the Folium Map should
            be saved. Include file type ending (.html).

    Returns:
        1 when done writing and printing the Folium map .html file.
    """
    if output_path[-5:] == '.html':
        pass
    else:
        raise ValueError('output file must be an html')
    f_map.save(f"{output_path}")
    current_directory = os.getcwd()
    print("Map saved, please copy this file path into any browser: "+\
          "file://"+
          current_directory+'/'+\
          f"{output_path}")
    return 1

def main_function(
        table_name,
        s0801_path,
        s1902_path,
        segment_path,
        census_path):
    """Combines ACS data, downloads speed data, and plots map of results.

    Build the final map by first preparing ACS and dynamodb data, then plotting
    the data using the Folium library and save it to a .html file and open with
    the user's web browser.

    Args:
        table_name: The name of the dynamodb table containing speed data.
        s0801_path: A string path to the location of the raw s0801 data, not
            including file type ending (.csv).
        s1902_path: A string path to the location of the raw s1902 data, not
            including file type ending (.csv).
        segment_path: A string path to the geojson file generated by
            initialize_db.py that contains route coordinate data.
        census_path: A string path to the geojson TIGER shapefile as
            downloaded from the ACS, containing polygon data for census tracts
            in the state of Washington.

    Returns:
        1 when done writing and opening the Folium map .html file.
    """
    # Combine census tract data from multiple ACS tables for Seattle
    print("Modifying and writing census data...")
    write_census_data_to_csv(s0801_path, s1902_path, census_path)

    # Connect to dynamodb
    print("Connecting to dynamodb...")
    table = connect_to_dynamo_table(table_name)

    # Query the dynamoDB for all speed data
    print("Getting speed data from dynamodb...")
    speed_lookup = table_to_lookup(table)

    print("Writing speed data to segments for visualization...")
    speeds = write_speeds_to_map_segments(
        speed_lookup,
        segment_path)

    # Create the color mapping for speeds
    print("Generating map...")
    linear_cm = cm.LinearColormap(
        ['red', 'yellow', 'green'],
        vmin=0.0,
        vmax=np.ceil(np.percentile(speeds[speeds > 0.0], 95)))

    f_map = generate_folium_map(segment_path, census_path, linear_cm)
    print("Saving map...")
    save_and_view_map(f_map, 'output_map.html')
    return 1

if __name__ == "__main__":
    main_function(
        table_name='KCM_Bus_Routes',
        s0801_path='./transit_vis/data/s0801',
        s1902_path='./transit_vis/data/s1902',
        segment_path='./transit_vis/data/kcm_routes',
        census_path='./transit_vis/data/seattle_census_tracts_2010')
