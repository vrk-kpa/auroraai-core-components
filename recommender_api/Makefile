MAKEFILE_PATH := $(abspath $(lastword $(MAKEFILE_LIST)))
API_DIR := $(dir $(MAKEFILE_PATH))

# Tear down resources (e.g. DB) after target exit
define teardown
	$(MAKE) service_recommender_db_down
endef

.ONESHELL:

service_recommender_setup: ## Run initial development environment setup
	cd $(API_DIR)
	pip3 install virtualenv
	virtualenv -p python3 venv
	. venv/bin/activate
	pip wheel --wheel-dir .wheel_cache -r requirements.txt
	pip wheel --wheel-dir .wheel_cache -r requirements.dev.txt
	pip install --no-index --find-links=.wheel_cache -r requirements.txt
	pip install --no-index --find-links=.wheel_cache -r requirements.dev.txt

service_recommender_db_up:
	cd $(API_DIR)
	docker compose up -d postgresql
	docker compose run --rm recommender-flyway

service_recommender_db_down:
	cd $(API_DIR)
	docker compose rm -sf postgresql
	docker compose rm -sf recommender-flyway

service_recommender_api_dev: service_recommender_db_up ## Start API for local development
	trap '$(call teardown)' EXIT
	cd $(API_DIR)
	. venv/bin/activate
	cd ..
	ENVIRONMENT=local PYTHONPATH=$(API_DIR) python -m recommender_api.debug_main

service_recommender_test: service_recommender_db_up ## Run tests
	sleep 1
	trap '$(call teardown)' EXIT
	cd $(API_DIR)
	. venv/bin/activate
	cd ..
	ENVIRONMENT=localunittest PYTHONPATH=./recommender_api python -m pytest recommender_api/tests recommender_api/tools/tests

data_loader_test: service_recommender_db_up ## Run tests
	sleep 1
	trap '$(call teardown)' EXIT
	cd $(API_DIR)
	. venv/bin/activate
	cd ..
	ENVIRONMENT=localunittest AAI_RECOMMENDER_CONFIG_FILE=recommender_api/ptv_data_loader/config.yml PYTHONPATH=./recommender_api python -m pytest recommender_api/ptv_data_loader/tests


service_recommender_lint: ## Run linter
	cd $(API_DIR)
	. venv/bin/activate
	PYTHONPATH=. pylint --output-format=colorized **/*.py

service_recommender_mypy: ## Run type checks
	cd $(API_DIR)
	. venv/bin/activate
	cd ..
	mypy --ignore-missing-imports --no-site-packages --exclude venv/ recommender_api

service_recommender_check: service_recommender_test service_recommender_lint service_recommender_mypy ## Run tests, linter, and type checks

service_recommender_fetch_search_models: service_recommender_fetch_fasttext_model ## Fetch models required to run the API with string search

service_recommender_fetch_fasttext_model:
	cd $(API_DIR)
	mkdir fasttext
	aws-vault exec dvv-suomiai-dev -- aws s3 sync s3://service-recommender-dev/fasttext fasttext

