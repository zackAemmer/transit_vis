CREATE TABLE active_trips_study (
	tripID integer,
	vehicleID integer,
	lat float,
	lon float,
	orientation integer,
	scheduleDeviation integer,
	totalTripDistance float,
	tripDistance float,
	closestStop integer,
	nextStop integer,
	locationTime integer,
	collectedTime integer
);
CREATE INDEX tripid_idx ON active_trips_study (tripid);
CREATE INDEX loctime_idx ON active_trips_study (locationTime);