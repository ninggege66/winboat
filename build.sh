#!/bin/bash
set -e
echo "Starting build process..."
bun run build:linux-gs
echo "Build completed successfully. Artifact is in dist/"
