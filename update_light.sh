#!/bin/bash

# Exit if any command fails
set -e

# Get the current branch name
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Commit and push changes in the current branch
git add .
git commit -m "Update content" || true
git push origin "$CURRENT_BRANCH"
