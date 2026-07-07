#!/bin/sh
set -e

DATA_PATH="${DATA_PATH:-/app/data}"
mkdir -p "$DATA_PATH/worlds"
mkdir -p "$DATA_PATH/db"
echo "[VoxelForge] Ensured data directories at $DATA_PATH"

if [ "$1" = "node" ]; then
  exec "$@"
else
  exec node src/server.js
fi
