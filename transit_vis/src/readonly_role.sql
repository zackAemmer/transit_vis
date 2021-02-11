CREATE ROLE cp_readonly;
GRANT CONNECT ON DATABASE "kcm-gtfs" TO cp_readonly;
GRANT USAGE ON SCHEMA public TO cp_readonly;

GRANT SELECT ON TABLE "active_trips_study" TO cp_readonly;

CREATE USER chintan WITH PASSWORD 'DtszPDGuK4Pdc&';
GRANT cp_readonly TO chintan;
174.21.180.42