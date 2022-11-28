FROM public.ecr.aws/docker/library/node:16.15.1-bullseye AS builder
RUN useradd -r -u 1001 -g root nonroot
COPY locale/ /locale
WORKDIR /builder

COPY attributes_management/ ./
COPY .yarn /.yarn


RUN yarn install --immutable
RUN NODE_ENV=production yarn build

RUN rm -rf node_modules
RUN NODE_ENV=production yarn install --immutable

RUN cp -LR node_modules node_modules_nosym

# Production image, copy all the files and run
FROM gcr.io/distroless/nodejs:16 AS runner
WORKDIR /attributes_management

# Copy build
COPY --from=builder /builder/dist/ ./dist/
COPY --from=builder /builder/node_modules_nosym/ ./node_modules/
COPY --from=builder /builder/config.yml ./config.yml

USER nonroot
CMD ["dist/index.js"]
