MAKEFILE_PATH := $(abspath $(lastword $(MAKEFILE_LIST)))
UI_DIR := $(dir $(MAKEFILE_PATH))
SERVER_DIR := $(join $(UI_DIR), server/)
FRONTEND_BUILD_DIR := $(join $(UI_DIR), )
RESOURCES := $(abspath $(UI_DIR)/../resources/municipality_codes.json)
UI_RESOURCES_DIR := $(join $(UI_DIR), src/resources/)
CONFIG_FILE := $(abspath $(UI_DIR)/../config.yml)

.ONESHELL:

demo_ui_resources: # Copy resources for UI
	mkdir -p $(UI_RESOURCES_DIR) && cp $(RESOURCES) $(UI_RESOURCES_DIR)

demo_ui_install: ## Install UI dependencies
	cd $(UI_DIR)
	yarn install --immutable
	cd $(SERVER_DIR)
	yarn install --immutable

demo_ui_dev: ## Start development server for UI
	cd $(UI_DIR)
	yarn start

demo_ui_test: ## Run tests for UI
	cd $(UI_DIR)
	yarn run test

demo_ui_build: demo_ui_resources ## Create UI production build
	cd $(UI_DIR)
	yarn run build

demo_ui_server: ## Run UI backend server
	cd $(SERVER_DIR)
	ENVIRONMENT=local yarn dev
