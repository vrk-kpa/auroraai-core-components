#!/usr/bin/env bash

set -o nounset -o errexit -o pipefail

apt-get update && apt-get install -y jq
rm -fr build
yarn install --immutable

for target in "$@"
do
  mkdir -p "build/dist/$target"

  # copy express script to build (backend)
  cp -r node_modules index.js build
  # copy relevant swagger-ui-dist to build/dist (frontend)
  cp -r \
    node_modules/swagger-ui-dist/swagger-ui*.js \
    node_modules/swagger-ui-dist/swagger-ui*.js.map \
    node_modules/swagger-ui-dist/swagger-ui.css \
    node_modules/swagger-ui-dist/*.png \
    node_modules/swagger-ui-dist/*.html \
    "build/dist/$target"
  # replace swagger-ui-dist index.html with our own custom one (frontend)
  cp index.html "build/dist/$target"
  cp -a ../schemas/. "build/dist/$target"


  # copy the api spec and remove relative paths from `$ref`s
  jq '(.. | objects | select(has("$ref")))["$ref"] |= sub("^(../)+"; "")' "../$target/openapi.json" > "build/dist/$target/swagger.json"
done


