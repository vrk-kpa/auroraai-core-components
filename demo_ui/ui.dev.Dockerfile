FROM public.ecr.aws/docker/library/node:16.15.1-bullseye

WORKDIR /ui
COPY .yarn /.yarn
COPY .npmrc .npmrc

# install deps
COPY demo_ui/package.json package.json
COPY demo_ui/yarn.lock yarn.lock
COPY demo_ui/.yarnrc .yarnrc
COPY demo_ui/Makefile Makefile

COPY demo_ui/server/package.json server/package.json
COPY demo_ui/server/yarn.lock server/yarn.lock

RUN make demo_ui_install

# Copy server sources and build
COPY demo_ui/server /ui/server
COPY resources/municipality_codes.json /resources/
RUN yarn build:server

# run frontend with hot-reload
CMD yarn run dev
