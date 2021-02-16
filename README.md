[![Netlify Status](https://api.netlify.com/api/v1/badges/7fa6c3e9-4631-46f1-b0ce-284d63a032be/deploy-status)](https://app.netlify.com/sites/boring-almeida-a309db/deploys)

## Transit Vis
[Performance Visualization Tool (Work In-Progress)](https://www.transitvis.com)

### Motivation
Transit delays are unavoidable, but they can be planned for through common practices such as schedule padding, or negated with roadway/intersection treatments such as transit signal priority. Overall, these practices improve the reliability and efficiency of the system. It is then beneficial to have a high-level understanding of which stops, intersections, or streets in a transit network create the most delays, or have the most unpredictable performance. Most if not all major transit agencies collect bus location and ridership data through Automatic Vehicle Location (AVL) and Automatic Passenger Count (APC) data collection systems, and use this data to improve their system performance. Unfortunately, these systems can be proprietary and are essentially closed off to outside use. However, some forward-thinking agencies repackage this data in programming APIs, or other web-based feeds that allow real-time bus location data to be queried and put to use. The most useful way of repackaging this data is through the Generalized Transit Feed Specification's Realtime component (GTFS-RT) developed by Google, which has provided a generalized set of parameters for making real-time transit feeds possible, and therefore allowing for the precise location and classification of transit delays. The original GTFS framework has been adopted near-universally by transit agencies for providing static, up-to-date bus schedule information. At its core, this project develops a visualization tool to display performance metrics derived from the King County Metro GTFS-RT feed (OneBusAway API). It has the added benefit of being constructed on the GTFS-RT standard, so that it is easily extendable to any other transit agency which repackages its individual AVL data in the GTFS-RT format.

### Sample Visualization
![Screenshot of Visualization Map with Speed Data](transit_vis_webapp/public/thumbnail.JPG?raw=true "Example of Tool Output")

### Transit Vis Setup
Prior to installing this project, make sure to install [anaconda](https://anaconda.org/)

#### Once anaconda is installed:
1. From terminal clone the repository: git clone https://github.com/zackAemmer/transit_vis.git
2. From terminal create the conda environment: conda env create -q -n transit_vis --file environment.yml
3. From terminal activate the conda environment: conda activate transit_vis

#### If setting up the backend for a new transit vis network:
4. Create RDS database using create_gtfs_tables.sql. Scrape GTFS-RT source data to this location  
5. Copy AWS credentials for the account holding the transit data to config.py
6. From terminal run once: python -m transit_vis.src.initialize_dynamodb
7. From terminal run daily: python -m transit_vis.src.summarize_rds

#### If using an existing backend:
4. Copy AWS credentials for the account holding the transit data to a file named config.py in the root project folder

### Transit Vis Operation
Once setup has been completed, a local map can be generated and viewed for analysis:
1. From terminal run: python -m transit_vis.src.transit_vis
2. Open the output_map.html file located in the root project folder

### Tool Components / Data Flow
* Create GTFS Tables
* Scrape OBA
* Initialize DynamoDB
* Summarize RDS
* Transit Vis/Transit Vis Webapp

#### Included Files
```
transit_vis/
    |- README.md
    |- LICENSE.md
    |- transit_vis/
        |- src/
            |- cloud/
                |- create_gtfs_tables.sql
                |- scrape_oba.py
                |- summarize_rds.py
            |- local/
                |- initialize_dynamodb.py
                |- transit_vis.py
        |- data/
            |- kcm_routes_inservice.geojson
            |- stops.geojson
            |- streets.geojson
            |- streets_0002buffer.geojson
            |- streets_routes_0002buffer.geojson
    |- transit_vis_webapp/
```

### Project Data and Resources Used
* [OneBusAway API Documentation](http://developer.onebusaway.org/modules/onebusaway-application-modules/current/api/where/index.html)
* [Sound Transit Open Transit Data (API Access)](https://www.soundtransit.org/help-contacts/business-information/open-transit-data-otd)
* [King County Metro GTFS Data (Static Route Shapes and Vehicle/Trip IDs)](http://metro.kingcounty.gov/gtfs/)
* [SDOT Seattle Street Segments Dataset](https://data-seattlecitygis.opendata.arcgis.com/datasets/seattle-streets)
* [Google GTFS-RT](https://github.com/google/transit/tree/master/gtfs-realtime/spec/en)