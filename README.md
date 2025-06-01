# Module-Legacy-Code

This repository hosts an existing codebase for you to work with.

The codebase is a web-app called PurpleForest. It consists of a single-page application frontend written in JavaScript, a backend written in Python, and a PostgreSQL database.

The repository contains a number of bug reports and feature requests as issues in this repo.

Your objective is to understand the codebase, debug and fix the bug reports, and implement the feature requests.

## Prerequisites

- [Python 3](https://www.python.org/downloads/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Setup

- Run `./quickstart.sh`
- Restart VS Code to pick up the new virtual environment
- Run `python backend/main.py` and `db/run.sh` in separate terminal tabs
- Open `front-end/index.html` with Live Server
- In a third tab, run:
  - `db/create-schema.sh`; then
  - `python backend/populate.py`; then
  - `npm --prefix=front-end run test`.
