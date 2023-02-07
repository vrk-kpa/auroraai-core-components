FROM public.ecr.aws/docker/library/node:16.15.1-bullseye AS ui_builder

WORKDIR /ui
COPY .yarn /.yarn
COPY .npmrc .npmrc

# Copy UI contents
COPY demo_ui/ /ui/
COPY resources/municipality_codes.json /resources/

# Build UI
RUN make demo_ui_install
RUN make demo_ui_build

WORKDIR /ui/server
RUN yarn install
RUN yarn run build


# See https://github.com/GoogleContainerTools/distroless
FROM gcr.io/distroless/nodejs:16 AS runner

COPY --from=ui_builder /ui/server/dist /ui/server
COPY --from=ui_builder /ui/server/node_modules /ui/server/node_modules
 
# Copy UI build
COPY --from=ui_builder /ui/build/ /ui/build/
COPY demo_ui/config.yml /ui/config.yml

WORKDIR /ui/server
CMD ["index.js"]
