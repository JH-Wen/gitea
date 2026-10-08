#!/usr/bin/env bash
set -euo pipefail

cd /workspaces/gitea
dev_path=/home/vscode/.local/share/gitea-hastur
mkdir -p "$dev_path"
if [ ! -f "$dev_path/app.ini" ]; then
  cp .devcontainer/hastur-app.ini "$dev_path/app.ini"
fi
exec ./gitea --work-path "$dev_path" --config "$dev_path/app.ini" web
