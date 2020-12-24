"""Builds a network of segments from individual bus routes and uploads them.

This module is intended to be run as a setup prior to using the visualization
tool. It takes a geojson file with complete bus routes and breaks them into
individual segments, before rejoining them to a specified minimum length and
uploading those segments to a dynamodb database. Once this has been done, the
summarize_rds.py module can aggregate bus speeds to these recreated segments.
"""


import json
import os

import boto3

import config as cfg


def sort_and_save_exploded_lines(exploded_geojson_name, output_folder):
    """Sorts geojson bus segments based on route id.

    Sifts through a geojson file that contains exploded route segments that are
    not necessarily in order. Sorts those segments according to their route id
    and creates a geojson file for each route id in a specified output folder.
    Also creates a list of keys for each route id for reference.
    
    Args:
        exploded_geojson_name: Path to the exploded geojson file that is to be
            uploaded. Must have [properties][ROUTE_ID] and
            [properties][LOCAL_EXPR] elements. Do not include file type ending
                (.geojson etc.).
        output_folder: Path to folder where sorted segments and keys should be
            saved.

    Returns:
        1 if function runs successfully. Also writes keys and labeled segments
        to specified output folder.
    """
    with open(f"{exploded_geojson_name}.geojson", 'r') as f:
        kcm_routes = json.load(f)
    # Sort route data by its route label to make processing it faster
    data = kcm_routes['features']
    label_sorted = {}
    for datapoint in data:
        k = datapoint['properties']['ROUTE_ID']
        if k not in label_sorted.keys():
            label_sorted[k] = [datapoint]
        else:
            label_sorted[k].append(datapoint)
    for key in label_sorted.keys():
        # Open file specific to each label
        with open(f"{output_folder}/label_{key}.json", "w+") as outfile:
            json.dump(label_sorted[key], outfile)
    # Save a list of keys
    with open(f"{output_folder}/labels.json", "w+") as outfile:
        json.dump(list(label_sorted.keys()), outfile)
    return 1

def join_line_segments(input_folder, min_segment_length):
    """Joins exploded lines to recreate segments of specified length.

    Uses the sorted line segments from sort_and_save_exploded_lines to create
    a new set of features. Each feature is a continuous set of segments that all
    share a route id, and is not shorter than the specified segment length.
    These features will be used to aggregate speeds in the dynamodb, and in the
    final Folum visualization.
    
    Args:
        input_folder: Path to the folder specified in sort_and_save where sorted
            line segments and keys can be found.
        min_segment_length: The minimum length that final features should have.

    Returns:
        A tuple containing the list of joined line segments features, a list of
        features that were unable to be rejoined, and the set of keys that were
        used in sorting the features.
    """
    feature_list = []
    isolated_list = []
    keys = []
    with open(f"{input_folder}/labels.json", "r") as keyfile:
        keys = json.load(keyfile)
    for k in keys:
        with open(f"{input_folder}/label_{k}.json", "r") as f:
            data = json.load(f)
            i = 0
            isolated_segments = []
            # Iterate once through the exploded segments with while(i)
            while i < len(data):
                # Continue unless current segment is too short
                if data[i]['properties']['SEG_LENGTH'] > min_segment_length:
                    i += 1
                    continue
                # Remove the short segment from data
                segment = data.pop(i)
                start = segment['geometry']['coordinates'][0]
                end = segment['geometry']['coordinates'][-1]
                flag = False
                # Search full dataset for a connected segment, append if found
                for j in range(0, len(data)):
                    seg2 = data[j]
                    if end == seg2['geometry']['coordinates'][0]:
                        seg2['geometry']['coordinates'].append(
                            segment['geometry']['coordinates'][0])
                        seg2['properties']['SEG_LENGTH'] += segment['properties']['SEG_LENGTH']
                        flag = True
                        break
                    elif start == seg2['geometry']['coordinates'][-1]:
                        seg2['geometry']['coordinates'].append(
                            segment['geometry']['coordinates'][-1])
                        seg2['properties']['SEG_LENGTH'] += segment['properties']['SEG_LENGTH']
                        flag = True
                        break
                if not flag:
                    # The too short segment did not have a match anywhere
                    isolated_segments.append(segment)
        feature_list.extend(data)
        isolated_list.extend(isolated_segments)
    return (feature_list, isolated_list, keys)
