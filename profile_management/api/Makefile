MAKEFILE_PATH := $(abspath $(lastword $(MAKEFILE_LIST)))
PROFILE_API_DIR := $(dir $(MAKEFILE_PATH))
TOOLS_DIR := $(PROFILE_API_DIR)../../ts-tools

.ONESHELL:

profile_api_db_up:
	cd $(PROFILE_API_DIR)
	POSTGRES_PORT=7001 docker-compose up -d profile_postgres
	docker-compose run --rm profile_flyway

profile_api_db_down:
	cd $(PROFILE_API_DIR)
	docker-compose rm -sf profile_postgres
	docker-compose rm -sf profile_flyway

profile_api_install: ## Install profile management API dependencies
	cd $(PROFILE_API_DIR)
	yarn install

profile_api_build: ## Create profile management API production build
	cd $(PROFILE_API_DIR)
	yarn build

profile_api_dev: profile_api_db_up ## Start development server for profile management API
	cd $(PROFILE_API_DIR)
	ENVIRONMENT=local yarn dev

profile_api_test_db_up:
	cd $(PROFILE_API_DIR)
	POSTGRES_DB=profile_management_test POSTGRES_PORT=25241 docker-compose --project-name profile-management-test up -d

profile_api_test_db_down:
	cd $(PROFILE_API_DIR)
	COMPOSE_PROJECT_NAME=profile-management-test docker-compose down

profile_api_wait_migration:
	cd ${TOOLS_DIR} && MIGRATION_DIR=profile_management/api/migrations/sql DB_HOST=127.0.0.1 DB_NAME=profile_management_test DB_PORT=25241 DB_USER=postgres DB_PASSWORD=admin ./node_modules/.bin/ts-node wait-until-migrated.ts

profile_api_test: profile_api_test_db_down profile_api_test_db_up profile_api_wait_migration
	cd $(PROFILE_API_DIR)
	ENVIRONMENT=local DB_HOST=127.0.0.1 DB_PORT=25241 DB_USER=postgres DB_PASSWORD=admin DB_NAME=profile_management_test yarn test $(pattern)
