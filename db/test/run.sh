#!/bin/bash

setup() {
  rm -f ./db/test/project.tpy
  node scripts/db.js create -F ./db/test/project.tpy -N "Test Project"
}

run() {
  sqlite3 ./db/test/project.tpy < ./db/test/$1.sql
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
