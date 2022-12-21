FROM public.ecr.aws/docker/library/python:3.9-slim-bullseye
# Same python version as in runtime image

# Install required Debian pakgs client to build image
RUN apt-get update
RUN apt-get -y install postgresql-client libpq-dev curl build-essential

# Install Rust compiler needed to build Tokenizers package
RUN curl https://sh.rustup.rs -sSf | bash -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Copy cached wheel packages (see make service_recommender_setup)
COPY ./recommender_api/.wheel_cache /app/recommender_api/.wheel_cache
WORKDIR /app

# Load requirements that are not in cache and install
COPY ./recommender_api/requirements.txt /app/recommender_api/
RUN python -m pip --default-timeout=1000 \
    wheel --wheel-dir ./recommender_api/.wheel_cache -r ./recommender_api/requirements.txt
RUN python -m pip --default-timeout=1000 \
    install --no-index --find-links=./recommender_api/.wheel_cache \
    -r ./recommender_api/requirements.txt -t ./recommender_api/pythonlibs

# Load dev requirements that are not in cache and install
COPY ./recommender_api/requirements.dev.txt /app/recommender_api/
RUN python -m pip --default-timeout=1000 \
    wheel --wheel-dir ./recommender_api/.wheel_cache -r ./recommender_api/requirements.dev.txt
RUN python -m pip --default-timeout=1000 \
    install --no-index --find-links=./recommender_api/.wheel_cache \
    -r ./recommender_api/requirements.dev.txt -t ./recommender_api/pythonlibs

COPY ./recommender_api/tools ./recommender_api/tools

# Add the rest of project stuff
COPY ./recommender_api /app/recommender_api/
COPY resources /app/resources

RUN rm -rf ./recommender_api/.wheel_cache


ENV PYTHONPATH=/app/recommender_api/pythonlibs

ENTRYPOINT [ "python" ]
