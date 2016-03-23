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

function schema(db, stream, cb) {
  const promise =  new Promise((resolve) => {
    stream.write(`digraph {
  node [shape=Mrecord];
  graph [overlap=false];


}`)
    resolve()
  })

  if (cb) {
    promise.then(cb).catch(cb)
  }

  return promise
}

function fail(error) {
  if (error) {
    process.stderr.write(`${error.message}:\n${error.stack}\n`)
  }
}


const db = new sqlite.Database(argv._[0], sqlite.OPEN_READONLY, error => {
  if (error) return fail(error)

  const proc = spawn(argv.type, [`-T${argv.format}`, `-o${argv.out}`])

  proc.stderr.pipe(process.stderr)

  schema(db, proc.stdin)
    .catch(fail)
    .then(() => {
      db.close()
      proc.stdin.end()
    })
})


