[![Netlify Status](https://api.netlify.com/api/v1/badges/7fa6c3e9-4631-46f1-b0ce-284d63a032be/deploy-status)](https://app.netlify.com/sites/boring-almeida-a309db/deploys)

## Transit Vis
[Performance Visualization Tool](https://www.transitvis.com)

### Motivation
This project develops a visualization tool to display performance metrics derived from the King County Metro GTFS-RT feed (OneBusAway API). It has the added benefit of being constructed on the GTFS-RT standard, so that it is easily extendable to other feeds.

Transit delays are unavoidable, but they can be planned for through common practices such as schedule padding, or negated with roadway/intersection treatments such as transit signal priority. To inform the location and type of treatment it can be beneficial to have a high-level understanding of which stops, intersections, or streets in a transit network create the most delays, or have the most unpredictable performance. Most if not all major transit agencies collect bus location and ridership data through Automatic Vehicle Location (AVL) and Automatic Passenger Count (APC) data collection systems, and use this data to improve their system performance. Some agencies repackage this data in programming APIs, or other web-based feeds that allow real-time bus location data to be queried and put to use. The Generalized Transit Feed Specification's Realtime component (GTFS-RT) developed by Google, is a set of guidelines for formatting this data that are growing in popularity, and provide a generalized set of parameters for real-time transit feeds. The original GTFS framework has been adopted near-universally by transit agencies for providing static, up-to-date bus scheduling information.

### Data Sample
A sample of the processed bus data (prior to being uploaded to the summary database) can be found in "05_30_21_data_sample.csv" stored in the root directory of this project. We are happy to provide access to the full dataset on individual request.

### Sample Visualization
![Screenshot of Visualization Map with Speed Data](transit_vis_webapp/public/thumbnail.JPG?raw=true "Example of Tool Output")

### TransitVis Setup (for building maps with Folium locally, or setting up a new web tool)
Prior to installing this project, make sure to install [anaconda](https://anaconda.org/)

#### Once anaconda is installed:
1. From terminal clone the repository: git clone https://github.com/zackAemmer/transit_vis.git
2. From terminal create the conda environment: conda env create -q -n transit_vis --file environment.yml
3. From terminal activate the conda environment: conda activate transit_vis

#### If setting up the backend for a new TransitVis webapp:
4. Create RDS database using create_gtfs_tables.sql. Scrape GTFS-RT source data to this location.
5. Copy AWS credentials for the account holding the transit data to config.py
6. From terminal run once: python -m transit_vis.src.initialize_dynamodb
7. From terminal run to update web tool: python -m transit_vis.src.summarize_rds

#### If using an existing backend:
4. Copy AWS credentials for the account holding the transit data to a file named config.py in the root project folder. Be sure to not accidentally upload this file by adding it to .gitignore.

### Local TransitVis Operation
Once setup has been completed, a local map can be generated and viewed for analysis:
1. From terminal run: python -m transit_vis.src.transit_vis
2. Open the output_map.html file located in the root project folder

### Tool Components / Data Flow
* Create GTFS Tables
* Scrape OBA
* Initialize DynamoDB
* Summarize RDS
* TransitVis/TransitVis Webapp

### Project Data and Resources Used
* [OneBusAway API Documentation](http://developer.onebusaway.org/modules/onebusaway-application-modules/current/api/where/index.html)
* [Sound Transit Open Transit Data (API Access)](https://www.soundtransit.org/help-contacts/business-information/open-transit-data-otd)
* [King County Metro GTFS Data (Static Route Shapes and Vehicle/Trip IDs)](http://metro.kingcounty.gov/gtfs/)
* [SDOT Seattle Street Segments Dataset](https://data-seattlecitygis.opendata.arcgis.com/datasets/seattle-streets)
* [Google GTFS-RT Reference](https://github.com/google/transit/tree/master/gtfs-realtime/spec/en)