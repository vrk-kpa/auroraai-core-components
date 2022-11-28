FROM public.ecr.aws/docker/library/node:16.15.1-bullseye AS node_builder
RUN mkdir /builder
COPY api_doc/swagger_ui /builder/swagger_ui
COPY api_doc/core_components/ /builder/core_components
COPY api_doc/auroraai_service/ /builder/auroraai_service
COPY schemas/ /builder/schemas
WORKDIR /builder/swagger_ui
COPY .yarn /.yarn
RUN ./build.sh auroraai_service core_components

FROM gcr.io/distroless/nodejs:16
COPY --from=node_builder /builder/swagger_ui/build /app
WORKDIR /app
CMD ["index.js"]
