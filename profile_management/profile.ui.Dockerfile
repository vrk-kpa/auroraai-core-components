FROM public.ecr.aws/docker/library/node:16.15.1-bullseye AS builder
RUN useradd -r -u 1001 -g root nonroot
COPY locale/ /locale/

WORKDIR /builder

COPY profile_management/ .
COPY .yarn /.yarn
COPY profile_management/config.yml ./config.yml
COPY schemas/ /schemas

ENV NEXT_TELEMETRY_DISABLED 1

RUN yarn install --immutable
RUN NODE_ENV=production yarn workspace profile-management-ui build

RUN rm -rf node_modules api/node_modules ui/node_modules
RUN NODE_ENV=production yarn install --immutable

RUN cp -LR node_modules node_modules_nosym

# https://github.com/vinissimus/next-translate/issues/421 (1)
RUN cd ui && find ./pages \( -type d -exec mkdir -p "/builder/ui/dummyPages/{}" \; -o -type f -exec touch "/builder/ui/dummyPages/{}" \; \)

# Production image, copy all the files and run next
FROM gcr.io/distroless/nodejs:16 AS runner
WORKDIR /app

COPY --from=builder /builder/ui/next.config.js /builder/ui/server.js /builder/ui/i18n.js ./
COPY --from=builder /builder/ui/public ./public
COPY --from=builder /builder/ui/.next ./.next
COPY --from=builder /builder/node_modules_nosym ./node_modules
COPY --from=builder /builder/ui/package.json ./package.json
# https://github.com/vinissimus/next-translate/issues/421 (2)
COPY --from=builder /builder/ui/dummyPages .
COPY profile_management/config.yml ./config.yml

EXPOSE 3000

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

USER nonroot
CMD ["server.js"]