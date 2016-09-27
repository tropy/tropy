#!/bin/bash

setup() {
  rm -f ./db/test/test.tpy
  node scripts/db create -- ./db/test/test.tpy
}

run() {
  sqlite3 ./db/test/test.tpy < ./db/test/$1.sql
}

if [ $1 ]
then
  setup
  run $1
else
  for script in `ls ./db/test/*.sql`
  do
    setup
    run `basename -s .sql $script`
  done
fi
