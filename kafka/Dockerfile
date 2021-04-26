FROM bitnami/kafka:2.8.0

COPY ./docker-entrypoint.sh /docker-entrypoint.sh
# RUN chmod 755 /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["/opt/bitnami/scripts/kafka/run.sh"]