#!/bin/bash -x

set +e

curl -L https://github.com/probonopd/AppImages/raw/master/functions.sh \
  -o ./scripts/functions.sh

. ./scripts/functions.sh
