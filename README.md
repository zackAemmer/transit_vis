[![Netlify Status](https://api.netlify.com/api/v1/badges/7fa6c3e9-4631-46f1-b0ce-284d63a032be/deploy-status)](https://app.netlify.com/sites/boring-almeida-a309db/deploys)

## Transit Vis

### Background
Transit delays are unavoidable, and transit agencies often plan for them through practices such as schedule padding. While this can improve the reliability of transit systems by allowing for delays to occur and stay on schedule, it does not improve their efficiency. The General Transit Feed Specification Realtime (GTFS-RT) has provided a generalized set of real-time transit data to be released to the public, allowing for the precise location of transit delays. This provides a neatly packaged programming interface for Automatic Vehicle Location (AVL) data that is otherwise proprietary and confined to individual bus systems. From an urban planning perspective, it is useful to understand who is impacted most by transit delays, and to determine where these delays occur so that the impacts to various communities can be mitigated, if possible. At its core, this project develops a visualization tool that is capable of displaying locations of bus delay from the King County Metro GTFS-RT feed, and overlaying them with socioeconomic data from the American Community Survey (ACS) so that planners and community members in Seattle can visually determine areas where transit is slow and who is affected. It has the added benefit of being constructed on the GTFS-RT standard, so that it is easily extendable to any other transit agency which repackages its individual AVL data in the GTFS-RT format.

### Project Data Sources
* [King County Metro GTFS-RT Data](http://developer.onebusaway.org/modules/onebusaway-application-modules/current/api/where/index.html)
* [King County Metro GTFS Data](http://metro.kingcounty.gov/gtfs/)
* [All King Country Metro Routes](https://www5.kingcounty.gov/sdc/TOC.aspx?agency=transit)
