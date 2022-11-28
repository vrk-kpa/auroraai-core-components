MAKEFILE_PATH := $(abspath $(lastword $(MAKEFILE_LIST)))
ATTRIBUTES_MANAGEMENT_DIR := $(dir $(MAKEFILE_PATH))

.ONESHELL:


attributes_management_install: ## Install attributes management API dependencies
	cd $(ATTRIBUTES_MANAGEMENT_DIR)
	yarn install

attributes_management_build: ## Create attributes management API production build
	cd $(ATTRIBUTES_MANAGEMENT_DIR)
	yarn build

attributes_management_dev: ## Start development server for attributes management API
	cd $(ATTRIBUTES_MANAGEMENT_DIR)
	ENVIRONMENT=local yarn dev

attributes_management_test:
	cd $(ATTRIBUTES_MANAGEMENT_DIR)
	ENVIRONMENT=local yarn test $(pattern)
