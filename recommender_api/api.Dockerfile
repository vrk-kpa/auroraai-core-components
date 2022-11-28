FROM public.ecr.aws/docker/library/python:3.9-slim-bullseye AS builder

# Install required Debian pakgs client to build image
RUN apt-get update
RUN apt-get -y install libpq-dev build-essential

COPY .wheel_cache /app/.wheel_cache
WORKDIR /app

# install requirements from cache if possible
COPY requirements.txt /app/
RUN python -m pip --default-timeout=1000 wheel --wheel-dir .wheel_cache -r requirements.txt
RUN python -m pip --default-timeout=1000 install --no-index --find-links=.wheel_cache -r requirements.txt -t /pythonlibs

# install tools deps from cache if possible
COPY tools /tools
RUN python -m pip --default-timeout=1000 wheel --wheel-dir .wheel_cache /tools
RUN python -m pip --default-timeout=1000 install --no-index --find-links=.wheel_cache /tools -t /pythonlibs


FROM public.ecr.aws/docker/library/python:3.9-slim-bullseye

RUN apt-get update
RUN apt-get -y install postgresql-client

# Build information from Drone. Passed with build-args in CI pipeline
ARG DRONE_BRANCH=_
ARG DRONE_COMMIT_SHA=_
ARG DRONE_BUILD_NUMBER=_

# Add the project sources
COPY ./recommender_api /app/recommender_api/
COPY ptv_data_loader /app/ptv_data_loader/
COPY resources /app/resources

# Add the xgboost model file
COPY ./xgboost /app/xgboost/

# Copy flask start script to runtime image
COPY --from=builder /usr/local/bin/ /mylib/

# Copy python libs from builder
COPY --from=builder /pythonlibs /pythonlibs

WORKDIR /app

# Give build information to container
ENV BUILD_BRANCH=$DRONE_BRANCH
ENV BUILD_COMMIT_SHA=$DRONE_COMMIT_SHA
ENV BUILD_NUMBER=$DRONE_BUILD_NUMBER

ENV PYTHONPATH=/pythonlibs
ENV AWS_DEFAULT_REGION eu-west-1

# Use a nonroot user
RUN useradd --uid 1000 --user-group --shell /bin/bash --create-home --no-log-init --system nonroot
USER nonroot
