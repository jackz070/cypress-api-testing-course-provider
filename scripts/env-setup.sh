#!/bin/bash

#load the environment variables form .env if it exists
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

export GITHUB_SHA=$(git rev-parse --short HEAD)
export GITHUB_BRANCH=$(git rev-parse --abbrev-ref HEAD)