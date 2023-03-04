# OKE

One-Key Environment: An expansion docker compose.

## Prerequisite

1. Ubuntu or similar Linux system
1. [Git](https://git-scm.com/)
1. [Docker](https://docs.docker.com/engine/install/ubuntu/) version 20.10.17 or above
1. [Docker compose plugin](https://docs.docker.com/compose/install/linux/)
1. add user to docker group (Refer to [Docker run without sudo](https://www.baeldung.com/linux/docker-run-without-sudo))

## Install

```
npm build && npm i -g
```

## Usage

```
Usage: oke [options]

Create One-Key Environment of Micro-services

Options:
  -V, --version      output the version number
  -f, --file <path>  Compose configuration file (default: "./docker-compose.yml")
  -e, --env <path>   environment variables file (default: ".env")
  -h, --help         display help for command
```
