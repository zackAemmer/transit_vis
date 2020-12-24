#!/usr/bin/env python3
import requests
from datetime import datetime, timedelta
import time

import numpy as np
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

import config as cfg


def connect_to_rds():
    conn = psycopg2.connect(
        host=cfg.HOST,
        database=cfg.DATABASE,
        user=cfg.UID,
        password=cfg.PWD)
    return conn

def get_epoch_and_pst_24hr():
    utc = datetime.utcnow()
    pst = timedelta(hours=8)
    current_hour = (utc - pst).hour
    epoch = round(utc.timestamp())
    return current_hour, epoch

def remove_agency_tag(id_string):
    underscore_loc = id_string.find('_')
    final = int(id_string[underscore_loc+1:])
    return(final)

def query_active_trips(key, endpoint):
    call_text = endpoint + key
    response = requests.get(call_text)
    response = response.json()
    return response

def clean_active_trips(response):
    active_trip_statuses = response['data']['list']
    to_remove = []
    # Find indices of trips that are inactive or have no data
    for i, bus in enumerate(response['data']['list']):
        if bus['tripId'] == '' or bus['status'] == 'CANCELED' or bus['location'] == None:
            to_remove.append(i)
    # Remove inactive trips starting with the last index
    for index in sorted(to_remove, reverse=True):
        del active_trip_statuses[index]
    return active_trip_statuses

def upload_to_rds(to_upload, conn, collected_time):
    to_upload_list = []
    for bus_status in to_upload:
        to_upload_list.append(
            (remove_agency_tag(bus_status['tripId']),
            remove_agency_tag(bus_status['vehicleId']),
            round(bus_status['location']['lat'], 6),
            round(bus_status['location']['lon'], 6),
            round(bus_status['tripStatus']['orientation']),
            bus_status['tripStatus']['scheduleDeviation'],
            round(bus_status['tripStatus']['totalDistanceAlongTrip'], 6),
            round(bus_status['tripStatus']['distanceAlongTrip'], 6),
            remove_agency_tag(bus_status['tripStatus']['closestStop']),
            remove_agency_tag(bus_status['tripStatus']['nextStop']),
            int(str(bus_status['tripStatus']['lastLocationUpdateTime'])[:-3]),
            collected_time))
    with conn.cursor() as curs:
        execute_values(
            curs,
            "INSERT INTO active_trips_study (tripid, vehicleid, lat, lon, orientation, scheduledeviation, totaltripdistance, tripdistance, closeststop, nextstop, locationtime, collectedtime) VALUES %s",
            to_upload_list)
    return to_upload_list

def main_function():
    endpoint = 'http://api.pugetsound.onebusaway.org/api/where/vehicles-for-agency/1.json?key='
    conn = connect_to_rds()
    current_hour, current_epoch = get_epoch_and_pst_24hr()
    i = 0
    while current_hour < 19 and i < 10:
        response = query_active_trips(cfg.API_KEY, endpoint)
        current_hour, current_epoch = get_epoch_and_pst_24hr()
        cleaned_response = clean_active_trips(response)
        upload_to_rds(cleaned_response, conn, current_epoch)
        print('sleeping')
        time.sleep(2)
        print('done')
        i = i+1
    conn.close()
    
if __name__ == "__main__":
    main_function()