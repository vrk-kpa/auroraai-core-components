FROM public.ecr.aws/docker/library/python:3.9-slim-bullseye AS builder

# Install required Debian pakgs client to build image
RUN apt-get update
RUN apt-get -y install libpq-dev build-essential

COPY ./recommender_api /app/recommender_api/
WORKDIR /app

# install requirements from cache if possible
COPY ./recommender_api/requirements.txt /app/recommender_api/
RUN python -m pip --default-timeout=1000 \
    wheel --wheel-dir ./recommender_api/.wheel_cache -r ./recommender_api/requirements.txt
RUN python -m pip --default-timeout=1000 \
    install --no-index --find-links=./recommender_api/.wheel_cache \
    -r ./recommender_api/requirements.txt -t ./recommender_api/pythonlibs

RUN rm -Rf ./recommender_api/.wheel_cache


FROM public.ecr.aws/docker/library/python:3.9-slim-bullseye

RUN apt-get update
RUN apt-get -y install postgresql-client

# Build information from Drone. Passed with build-args in CI pipeline
ARG DRONE_BRANCH=_
ARG DRONE_COMMIT_SHA=_
ARG DRONE_BUILD_NUMBER=_

# Add the project sources
COPY --from=builder /app/recommender_api /app/recommender_api/
COPY resources /app/resources

# Copy flask start script to runtime image
COPY --from=builder /usr/local/bin/ /mylib/

WORKDIR /app

# Give build information to container
ENV BUILD_BRANCH=$DRONE_BRANCH
ENV BUILD_COMMIT_SHA=$DRONE_COMMIT_SHA
ENV BUILD_NUMBER=$DRONE_BUILD_NUMBER

ENV PYTHONPATH=/app/recommender_api/pythonlibs
ENV AWS_DEFAULT_REGION eu-west-1

# Use a nonroot user
RUN useradd --uid 1000 --user-group --shell /bin/bash --create-home --no-log-init --system nonroot
USER nonroot
