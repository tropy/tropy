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


const q = {
  tables: 'SELECT name FROM sqlite_master WHERE type = "table"'
}

function tables(db, stream) {
  return new Promise((resolve, reject) => {
    db.all(q.tables, (err, ts) => {
      if (err) return reject(err)

      for (let table of ts) {
        stream.write(`  t_${table.name} [label="${table.name}"]`)
      }

      resolve()
    })
  })
}

function digraph(db, stream) {
  return new Promise((resolve, reject) => {
    stream.write('digraph {\n')
    stream.write('  node [shape=Mrecord];\n')
    stream.write('  graph [overlap=false];\n')

    return tables(db, stream)
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


