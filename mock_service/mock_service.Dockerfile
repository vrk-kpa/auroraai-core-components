FROM public.ecr.aws/docker/library/node:16.15.1-bullseye AS builder
WORKDIR /builder

COPY .yarn /.yarn
COPY mock_service/ .

RUN yarn install --immutable
RUN  NODE_ENV=production yarn run build

RUN rm -rf node_modules
RUN NODE_ENV=production yarn install --immutable

# Production image, copy all the files and run next
FROM gcr.io/distroless/nodejs:16 AS runner
WORKDIR /app

COPY --from=builder /builder/ ./

EXPOSE 8000

ENV NODE_ENV production

CMD ["server/server.js"]