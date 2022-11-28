MAKEFILE_PATH := $(abspath $(lastword $(MAKEFILE_LIST)))
PROFILE_UI_DIR := $(dir $(MAKEFILE_PATH))

.ONESHELL:

profile_ui_install: ## Install profile management UI dependencies
	cd $(PROFILE_UI_DIR)
	yarn install

profile_ui_build: ## Create profile management UI production build
	cd $(PROFILE_UI_DIR)
	yarn run build

profile_ui_dev: profile_api_db_up ## Start development server for profile management UI
	cd $(PROFILE_UI_DIR)
	ENVIRONMENT=local yarn run dev
