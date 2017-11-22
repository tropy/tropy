#!/bin/bash

if ! command yq -h &>/dev/null; then
  echo 'missing dependency: yq'
  exit 1
fi

FILTER='.en | [paths as $path | {"key": $path | map(tostring) | join("."), "value": getpath($path)}] | map(select(.key|match("label$"))) | from_entries'

yq "$FILTER" res/menu/app.en.yml -y > app-menu.yml
yq "$FILTER" res/menu/context.en.yml -y > context-menu.yml
