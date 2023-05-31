# Use more robust error handling (pipefail and errexit) in subshells
# This is useful in EXIT trapping, to more reliably execute tear downs
export SHELLOPTS:=$(if $(SHELLOPTS),$(SHELLOPTS):)pipefail:errexit

MAKEFILE_PATH := $(abspath $(lastword $(MAKEFILE_LIST)))
ROOT_DIR := $(dir $(MAKEFILE_PATH))

# Colors
black=0
red=1
green=2
yellow=3
blue=4
magenta=5
cyan=6
white=7

# Helper for printing e.g. colorized text
define print
	@tput setaf $2
	@/bin/echo -n $1
	@tput sgr0
endef

define warn
	${call print, $1, ${yellow}}
endef

.ONESHELL:

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	| awk -F ':|##' -v colorized=$$(tput setaf 3) -v normal=$$(tput sgr0) '{print colorized$$2 "\t"normal$$NF}' \
	| column -s $$'\t' -t

include demo_ui/Makefile
include profile_management/api/Makefile
include recommender_api/Makefile
