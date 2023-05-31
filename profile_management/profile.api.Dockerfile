FROM public.ecr.aws/docker/library/node:16.15.1-bullseye AS builder
RUN useradd -r -u 1001 -g root nonroot
COPY locale/ /locale
WORKDIR /builder

COPY profile_management/ ./
COPY .yarn /.yarn
COPY schemas/ /schemas

# Build translations needed by the API
RUN node build_i18n.js

RUN yarn install --immutable
RUN NODE_ENV=production yarn workspace profile-management-api build

RUN rm -rf node_modules api/node_modules ui/node_modules
RUN NODE_ENV=production yarn install --immutable

RUN cp -LR node_modules node_modules_nosym

# Production image, copy all the files and run
FROM 373155601093.dkr.ecr.eu-north-1.amazonaws.com/base/nodejs-debian11:16 AS runner
WORKDIR /profile_management

# Copy build
COPY --from=builder /builder/api/dist/ ./dist/
COPY --from=builder /builder/node_modules_nosym/ ./node_modules/

COPY profile_management/config.yml ./config.yml

USER nonroot
CMD ["dist/index.js"]
