#!/usr/bin/env node

'use strict'

const spawn = require('child_process').spawn
const sqlite = require('sqlite3')
const assign = Object.assign
const extname = require('path').extname
const open = require('fs').createWriteStream


const argv = require('yargs')
  .usage('Usage: $0 [options] <database>')
  .demand(1)
  .wrap(78)

  .option('L', {
    alias: 'layout', describe: 'Layout command.', default: 'sfdp', choices: [
      'neato', 'dot', 'circo', 'fdp', 'osage', 'sfdp', 'twopi'
    ]
  })

  .options('e', {
    alias: 'edge-labels', type: 'boolean',
    describe: 'Label foreign key edges.'
  })

  .options('t', {
    alias: 'title', describe: 'Optional title string.'
  })

  .option('o', {
    alias: 'out', required: true, describe:
      'Output file (determines output format).'
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
      .then(fk => { table.fk = fk })
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


function quote(value) {
  return (value[0] === '<') ? `<${value}>` : `"${value}"`
}

function attr(attrs, sep) {
  return Object
    .keys(attrs)
    .map(prop => `${prop}=${quote(attrs[prop])}`)
    .join(sep || ', ')
}

function tag(name, content, options) {
  return (options) ?
    `<${name} ${attr(options, ' ')}>${content}</${name}>` :
    `<${name}>${content}</${name}>`
}

function font(content, options) {
  return tag('font', content, options)
}

function b(content, options) {
  return font(tag('b', content), assign({}, options))
}

function i(content, options) {
  return font(tag('i', content), assign({ color: 'grey60' }, options))
}

function td(content, options) {
  return tag('td', content, assign({
    align: 'left'
  }, options))
}

function tr(tds) {
  return tag('tr', tds.map(args => td(...args)).join(''))
}

function tb(trs, options) {
  return tag('table', trs.map(args => tr(...args)).join(''), assign({
    border: 0, cellspacing: 0.5
  }, options))
}

function head(table) {
  return tb([[[
    [b(table.name, { 'point-size': 11 }), { height: 24, valign: 'bottom' }]
  ]]])
}

function type(t) {
  return (t || 'none').toLowerCase()
}

function cols(column) {
  return [[[`${column.name}${column.pk ? '* ' : ' '}${i(type(column.type))}`]]]
}

function body(table) {
  return tb(table.columns.map(cols), { width: 134 })
}

function label(table) {
  return `${head(table)}|${body(table)}`
}

function edge(table, fk) {
  let options = argv.e ?
    { taillabel: fk.from, headlabel: fk.to } : {}

  return `t_${table.name} -> t_${fk.table} [${attr(options)}];`
}

function node(table) {
  let options = { label: label(table) }
  return `t_${table.name} [${attr(options)}];`
}

function digraph(db, title, stream) {
  return new Promise((resolve, reject) => {
    stream.write(`digraph ${db.name} {\n`)
    stream.write('  rankdir="LR";\n')
    stream.write('  ranksep="1.5";\n')
    stream.write('  nodesep="1.4";\n')
    stream.write('  concentrate="true";\n')
    stream.write('  pad="0.4,0.4";\n')
    stream.write('  fontname="Helvetica";\n')
    stream.write('  fontsize="10";\n')
    stream.write(`  label=<${b(title)}>;\n`)

    stream.write(`  node[${attr({
      shape: 'Mrecord',
      fontsize: 10,
      fontname: 'Helvetica',
      margin: '0.07,0.04',
      penwidth: '1.0'
    })}];\n`)

    stream.write(`  edge[${attr({
      arrowsize: '0.8',
      fontsize: 6,
      style: 'solid',
      penwidth: '0.9',
      fontname: 'Helvetica',
      labelangle: 33,
      labeldistance: '2.0'
    })}];\n`)

    stream.write('  graph [overlap=false];\n')

    return tables(db)
      .then(ts => {
        for (let table of ts) {
          stream.write(`  ${node(table)}\n`)
        }

        for (let table of ts) {
          for (let fk of table.fk) {
            stream.write(`  ${edge(table, fk)}\n`)
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
    digraph(db, argv.title || db.filename, stream).then(resolve, reject)
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

  let format = extname(argv.out).slice(1)
  let stream, proc

  if (format !== 'dot') {
    proc = spawn(argv.layout, [`-T${format}`, `-o${argv.out}`])
    proc.stderr.pipe(process.stderr)

    stream = proc.stdin

  } else {
    stream = open(argv.out, { autoClose: true })
  }

  schema(db, stream)
    .then(() => { db.close() })
    .then(() => { stream.end() })
    .catch(fail)
})
