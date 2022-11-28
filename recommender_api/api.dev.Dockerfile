FROM public.ecr.aws/docker/library/python:3.9-slim-bullseye
# Same python version as in runtime image

# Install required Debian pakgs client to build image
RUN apt-get update
RUN apt-get -y install postgresql-client libpq-dev curl build-essential

# Install Rust compiler needed to build Tokenizers package
RUN curl https://sh.rustup.rs -sSf | bash -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Copy cached wheel packages (see make service_recommender_setup)
COPY .wheel_cache /app/.wheel_cache
WORKDIR /app

# Load requirements that are not in cache and install
COPY requirements.txt /app/
RUN python -m pip --default-timeout=1000 wheel --wheel-dir .wheel_cache -r requirements.txt
RUN python -m pip --default-timeout=1000 install --no-index --find-links=.wheel_cache -r requirements.txt -t /pythonlibs

# Load dev requirements that are not in cache and install
COPY requirements.dev.txt /app/
RUN python -m pip --default-timeout=1000 wheel --wheel-dir .wheel_cache -r requirements.dev.txt
RUN python -m pip --default-timeout=1000 install --no-index --find-links=.wheel_cache -r requirements.dev.txt -t /pythonlibs

# Load requirements that are not in cache and install
COPY tools /tools
RUN python -m pip --default-timeout=1000 wheel --wheel-dir .wheel_cache /tools
RUN python -m pip --default-timeout=1000 install --no-index --find-links=.wheel_cache /tools -t /pythonlibs

# Add the rest of project stuff
COPY ./recommender_api /app/recommender_api/
COPY ./xgboost /app/xgboost/
COPY ptv_data_loader /app/ptv_data_loader/
COPY resources /app/resources

RUN rm -rf .wheel_cache


ENV PYTHONPATH=/pythonlibs

ENTRYPOINT [ "python" ]
