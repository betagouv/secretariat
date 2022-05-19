DOCKER-RUN = docker-compose run --rm
BUNDLE-EXEC = bundle exec

.PHONY: build
build:
	docker-compose build

.PHONY: up
up:
	docker-compose up

.PHONY: sh
sh:
	$(DOCKER-RUN) web sh
