import React from 'react';
import test from '../images/about_image.JPG';


const About = () => {
    return (
        <div className="about-page">
            <div className="about-image">
                <img src={test} alt="Sample image of main app screen"/>
            </div>
            <div className="about-text">
                <h3>About</h3>
                <p>TransitVis is an open source tool built to visualize real-time bus location data from the OneBusAway API. This tool was built as part of an ongoing study of bus interference at the University of Washington. On the backend, bus location data is scraped from the OneBusAway API, and uploaded to an AWS database. Once daily at 1AM PST, updated performance metrics are calculated from this data and summarized in this online tool. Transit speeds are calculated at 30 second increments for each active trip and assigned to the closest transit segment. Roadway segments from the Seattle Streets dataset are stored using a Ball Tree index to facilitate quick nearest-neighbor matching, and only segments that are traversed by a particular route are able to have tracked data from that route assigned to them. In cases where a segment does not have any tracked data available for a given day, the most recently available data is assigned.</p>

                <h5>Data and Resources Used</h5>
                <p>
                    <a href="http://developer.onebusaway.org/modules/onebusaway-application-modules/current/api/where/index.html">OneBusAway API Documentation</a>
                    <br />
                    <a href="https://www.soundtransit.org/help-contacts/business-information/open-transit-data-otd">Sound Transit Open Transit Data (API Access)</a>
                    <br />
                    <a href="http://metro.kingcounty.gov/gtfs/">King County Metro GTFS Data (Static Route Shapes and Vehicle/Trip IDs)</a>
                    <br />
                    <a href="https://github.com/google/transit/tree/master/gtfs-realtime/spec/en">Google GTFS-RT</a>
                    <br />
                </p>

                <h5>Contact</h5>
                <p>If you have any questions about the visualization tool, collection process, or other details please don't hesitate to reach out! All code for the web tool and scraping process is also available on Github.</p>
                <a href="mailto: zae5op@uw.edu">Zack Aemmer</a>
            </div>
        </div>
    );
};

export default About;