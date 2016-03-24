#!/usr/bin/env node

'use strict'

const spawn = require('child_process').spawn
const sqlite = require('sqlite3')


const argv = require('yargs')
  .usage('Usage: $0 [options] <database>')
  .demand(1)
  .wrap(78)

  .option('t', {
    alias: 'type', choices: ['neato', 'dot'], default: 'dot'
  })

  .option('f', {
    alias: 'format', choices: ['pdf', 'png'], default: 'pdf'
  })

  .option('o', {
    alias: 'out', required: true
  })

  .argv


function all(db, query, params) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) return reject(err)
      resolve(rows)
    })
  })
}

function tables(db) {
  return all(db, 'SELECT name FROM sqlite_master WHERE type = "table"')
    .then(ts =>
      Promise.all(ts.map(table =>
        all(db, `PRAGMA table_info('${table.name}')`)
          .then(columns => { table.columns = columns })
          .then(() => table))))
}


function digraph(db, stream) {
  return new Promise((resolve, reject) => {
    stream.write('digraph {\n')
    stream.write('  node [shape=Mrecord];\n')
    stream.write('  graph [overlap=false];\n')

    return tables(db)
      .then(ts => {
        for (let table of ts) {
          stream.write(`  t_${table.name} [label="${table.name}"]`)
        }
        return ts
      })
      .then(() => { stream.write('}\n') })
      .then(resolve, reject)
  })
}

function schema(db, stream, cb) {
  const promise =  new Promise((resolve, reject) => {
    digraph(db, stream).then(resolve, reject)
  })

  if (cb) {
    promise.then(cb).catch(cb)
  }

  return promise
}

function fail(error) {
  if (error) {
    process.stderr.write(`${error.stack}\n`)
  }
  process.exit(1)
}


const db = new sqlite.Database(argv._[0], sqlite.OPEN_READONLY, error => {
  if (error) return fail(error)

  const proc = spawn(argv.type, [`-T${argv.format}`, `-o${argv.out}`])

  proc.stderr.pipe(process.stderr)

  schema(db, proc.stdin)
    .then(() => {
      db.close()
      proc.stdin.end()
    })
    .catch(fail)
})


