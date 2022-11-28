#!/usr/bin/env bash

set -o nounset -o errexit -o pipefail

node build_i18n.js &&
  esbuild src/*.ts --bundle --platform=node --target=node14 --outdir=dist --sourcemap=inline &&
  cd dist &&
  zip -FS lambda.zip custom_message.js
