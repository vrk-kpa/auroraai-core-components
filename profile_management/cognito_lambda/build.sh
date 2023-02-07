#!/usr/bin/env bash

set -o nounset -o errexit -o pipefail

LOCALE_DIR="../../locale"
LOCALE_FILE="profileManagementUI.json"

if [ ! -e "$LOCALE_DIR/fi/$LOCALE_FILE" -o ! -e "$LOCALE_DIR/sv/$LOCALE_FILE" ]; then
    echo "Translations missing for fi and/or sv. Check the README in $LOCALE_DIR for instructions."
    exit 1
fi

node build_i18n.js &&
  esbuild src/*.ts --bundle --platform=node --target=node14 --outdir=dist --sourcemap=inline &&
  cd dist &&
  zip -FS lambda.zip custom_message.js
