FROM public.ecr.aws/docker/library/node:16.15.1-bullseye
RUN useradd -r -u 1001 -g root nonroot
COPY locale/ /locale
WORKDIR /builder

COPY attributes_management/tsconfig.json tsconfig.json

COPY attributes_management/.yarn/ .yarn
COPY .npmrc .npmrc
COPY attributes_management/package.json package.json
COPY attributes_management/.yarnrc .yarnrc

RUN yarn install
COPY attributes_management/config.yml ./config.yml

CMD yarn dev