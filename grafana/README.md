# Grafana Service

This folder contains a production-ready Grafana image configuration:

- `grafana.ini`: security + JWT auth for iframe embedding.
- `provisioning/datasources/supabase.yml`: PostgreSQL datasource (Supabase).
- `provisioning/dashboards/*`: dashboard provisioning for `ADMIN` and `MEMBER`.

## Required Railway variables (service: `grafana`)

- `DB_HOST`
- `DB_PORT`
- `DB_DATABASE`
- `DB_USER`
- `DB_PASSWORD`

Grafana reads these variables from the service environment to connect to Supabase.

## Required Railway variables (service: `backend`)

- `GRAFANA_JWT_PRIVATE_KEY` (PEM RS256 private key; set with stdin)
- Optional:
  - `GRAFANA_BASE_URL`
  - `GRAFANA_JWT_ISSUER`
  - `GRAFANA_JWT_TTL_SECONDS`
  - `GRAFANA_ORG_ID`
  - `GRAFANA_DASHBOARD_UID_ADMIN`
  - `GRAFANA_DASHBOARD_SLUG_ADMIN`
  - `GRAFANA_DASHBOARD_UID_MEMBER`
  - `GRAFANA_DASHBOARD_SLUG_MEMBER`

## Notes

- Public key used by Grafana lives at `jwt-public.pem`.
- Private key must never be committed.
