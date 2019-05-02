#!/usr/bin/env node

'use strict'

const fs = require('fs')
const pump = require('pump')
const split = require('split2')
const { Transform } = require('stream')
const chalk = require('chalk')
const ms = require('ms')

const CWD = new RegExp(process.cwd() + '.')

const format = log =>
  `${header(log)} ${body(log)}${error(log)}\n`

const body = log =>
  log.action ?
    `${log.action} ${chalk.gray(meta(log))}` :
    log.msg

const error = ({ stack }) =>
  stack ?
    '\n' + chalk.gray(
      stack
        .split('\n')
        .map(line => line.replace(CWD, ''))
        .join('\n')) : ''

const meta = log =>
  log.meta.rel ?
    `#${log.meta.seq}(${log.meta.rel}) Δ${ms(log.meta.now - log.meta.was)}` :
    `#${log.meta.seq}`

const header = log =>
  `${seq(log.time)} ${symbol(log)}`

const symbol = log =>
  colorize(log.level, SYMBOL[log.name])

const SYMBOL = {
  about: 'α',
  main: 'β',
  prefs: 'ρ',
  project: 'μ',
  wizard: 'φ'
}

const COLOR = [
  'magenta',
  'cyan',
  'blue',
  'red',
  'redBright',
  'yellow'
]

const colorize = (level, text) => {
  let color = COLOR[(level / 10) - 1]
  return (color in chalk) ? chalk[color](text) : text
}

const pretty = input => {
  let log

  if (typeof input === 'string') {
    try {
      log = JSON.parse(input)
    } catch (error) {
      return input
    }
  } else if (isObject(input)) {
    log = input
  }

  return (isPinoLog(log)) ? format(log) : input
}

const seq = (function (prev, pad = 8) {
  return (now) => {
    try {
      return chalk.gray(
        (prev > 0 ? `+${ms(now - prev)}` : '').padStart(pad, ' ')
      )
    } finally {
      prev = now
    }
  }
})()

const isObject = input =>
  Object.prototype.toString.apply(input) === '[object Object]'

const isPinoLog = log =>
  log != null && log.v === 1


const transport = new Transform({
  objectMode: true,
  transform(chunk, enc, cb) {
    let line = pretty(chunk.toString())
    if (line === undefined) return cb()
    cb(null, line)
  }
})

pump(process.stdin, split(), transport, process.stdout)

if (!process.stdin.isTTY && !fs.fstatSync(process.stdin.fd).isFile()) {
  process.once('SIGINT', () => {})
}
