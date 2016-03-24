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

function keys(db, ts) {
  return Promise.all(ts.map(table =>
    all(db, `PRAGMA foreign_key_list('${table.name}')`)
      .then(fks => { table.fk = fks.map(fk => fk.table) })
      .then(() => table)))
}

function columns(db, ts) {
  return Promise.all(ts.map(table =>
    all(db, `PRAGMA table_info('${table.name}')`)
      .then(cs => { table.columns = cs })
      .then(() => table)))
}

function tables(db) {
  return all(db, 'SELECT name FROM sqlite_master WHERE type = "table"')
    .then(ts => columns(db, ts))
    .then(ts => keys(db, ts))
}


function attr(attrs) {
  return Object
    .keys(attrs)
    .map(prop => `${prop}="${attrs[prop]}"`)
    .join(', ')
}

function digraph(db, stream) {
  return new Promise((resolve, reject) => {
    stream.write('digraph {\n')
    stream.write('  rankdir="LR";\n')
    stream.write('  ranksep="0.5";\n')
    stream.write('  nodesep="0.4";\n')
    stream.write('  concentrate="true";\n')
    stream.write('  pad="0.4,0.4";\n')
    stream.write('  fontname="Helvetica Bold";\n')
    stream.write('  fontsize="10";\n')
    stream.write(`  label="${db.filename}";\n`)

    stream.write(`  node[${attr({
      shape: 'Mrecord',
      fontsize: 10,
      fontname: 'Helvetica',
      margin: '0.07,0.04',
      penwidth: '1.0'
    })}];\n`)

    stream.write(`  edge[${attr({
      arrowsize: '0.9',
      fontsize: 7,
      fontname: 'Helvetica',
      labelangle: 32,
      labeldistance: '1.8'
    })}];\n`)

    stream.write('  graph [overlap=false];\n')

    return tables(db)
      .then(ts => {
        for (let table of ts) {
          stream.write(`  t_${table.name} [label="${table.name}|xy dfs"];\n`)
        }

        for (let table of ts) {
          if (table.fk.length) {
            for (let fk of table.fk) {
              stream.write(`  t_${table.name} -> t_${fk} [];\n`)
            }
          }
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


