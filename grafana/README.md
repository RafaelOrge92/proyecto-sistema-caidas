# Servicio Grafana

Esta carpeta contiene la configuracion de Grafana lista para produccion:

- `grafana.ini`: seguridad, autenticacion JWT y modo embed para iframe.
- `provisioning/datasources/supabase.yml`: datasource PostgreSQL (Supabase).
- `provisioning/dashboards/*`: provisionado de dashboards para `ADMIN` y `MEMBER`.

## Variables obligatorias en Railway (servicio `grafana`)

- `DB_HOST`
- `DB_PORT`
- `DB_DATABASE`
- `DB_USER`
- `DB_PASSWORD`

Grafana usa estas variables del entorno para conectarse a Supabase.

## Variables obligatorias en Railway (servicio `backend`)

- `GRAFANA_JWT_PRIVATE_KEY` (clave privada PEM RS256)

Variables opcionales:

- `GRAFANA_BASE_URL`
- `GRAFANA_JWT_ISSUER`
- `GRAFANA_JWT_TTL_SECONDS`
- `GRAFANA_ORG_ID`
- `GRAFANA_DASHBOARD_UID_ADMIN`
- `GRAFANA_DASHBOARD_SLUG_ADMIN`
- `GRAFANA_DASHBOARD_UID_MEMBER`
- `GRAFANA_DASHBOARD_SLUG_MEMBER`

## Notas

- La clave publica usada por Grafana esta en `jwt-public.pem`.
- La clave privada no se debe versionar nunca.
- El embed se genera en modo `panel-only` (`d-solo`) para reducir navegacion dentro de Grafana.
