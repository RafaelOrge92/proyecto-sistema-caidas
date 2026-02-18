FROM grafana/grafana-oss:latest

USER root

COPY grafana.ini /etc/grafana/grafana.ini
COPY jwt-public.pem /etc/grafana/jwt-public.pem
COPY provisioning /etc/grafana/provisioning
