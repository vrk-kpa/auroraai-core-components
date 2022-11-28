# Copy server source
FROM public.ecr.aws/docker/library/node:16.15.1-bullseye AS server_builder
COPY demo_ui/server/ /server

WORKDIR /server
RUN yarn install
RUN yarn run build
RUN cp -LR node_modules node_modules_nosym

FROM public.ecr.aws/docker/library/node:16.15.1-bullseye AS ui_builder

# Copy UI contents
COPY demo_ui/ /ui/
COPY resources/municipality_codes.json /resources/
WORKDIR /ui
COPY .yarn /.yarn
# Build UI
RUN make demo_ui_install
RUN make demo_ui_build


# See https://github.com/GoogleContainerTools/distroless
FROM gcr.io/distroless/nodejs:16 AS runner

COPY --from=server_builder /server/dist /ui/server
COPY --from=server_builder /server/node_modules /ui/server/node_modules
 
# Copy UI build
COPY --from=ui_builder /ui/build/ /ui/build/
COPY demo_ui/config.yml /ui/config.yml

WORKDIR /ui/server
CMD ["index.js"]
