FROM public.ecr.aws/docker/library/node:16.15.1-bullseye AS ui_builder

WORKDIR /ui
COPY .yarn /.yarn

# install deps
COPY demo_ui/package.json package.json
COPY demo_ui/yarn.lock yarn.lock
COPY demo_ui/.yarnrc .yarnrc
COPY demo_ui/Makefile Makefile
COPY demo_ui/.npmrc .npmrc

COPY demo_ui/server/package.json server/package.json
COPY demo_ui/server/yarn.lock server/yarn.lock

RUN make demo_ui_install

# Copy UI contents
COPY demo_ui/ /ui/
COPY resources/municipality_codes.json /resources/

# Build UI
RUN make demo_ui_build



FROM 373155601093.dkr.ecr.eu-north-1.amazonaws.com/base/nodejs-debian11:16 AS runner

COPY --from=ui_builder /ui/server/dist /ui/server/dist
COPY --from=ui_builder /ui/server/node_modules /ui/server/node_modules
 
# Copy UI build
COPY --from=ui_builder /ui/build/ /ui/build/
COPY demo_ui/config.yml /ui/config.yml

WORKDIR /ui/server
CMD ["dist/index.js"]
