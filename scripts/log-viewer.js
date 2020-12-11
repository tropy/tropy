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
  `${header(log)} ${body(log)}${error(log)}${end(log)}`

const end = log =>
  log.quit ? '\n\n' : '\n'

const body = log => {
  if (log.action)
    return `${log.action} ${chalk.gray(meta(log))}`
  if (log.url)
    return shorten(log.url, 65) + (
      (log.status && log.ms) ?
        ' ' + chalk.gray(`${log.status} Δ${ms(log.ms)}`) : ''
    )
  else
    return log.msg || log.message || '??'
}

const shorten = (s, maxLength) =>
  s.length > maxLength ?
    `${s.slice(0, maxLength - 2)} …` : s

const error = ({ stack, code }) =>
  stack ?
    '\n' + chalk.gray(
      stack
        .split('\n')
        .map(line => line.replace(CWD, ''))
        .join('\n')) : (code ? code : '')

const meta = log =>
  log.meta.was ?
    `#${log.meta.seq}(${log.meta.rel}) Δ${ms(log.meta.now - log.meta.was)}` :
    `#${log.meta.seq}`

const header = log =>
  `${seq(log.time)} ${symbol(log)}`

const symbol = log =>
  colorize(log.level, SYMBOL[log.name])

const SYMBOL = {
  about: 'α',
  api: 'λ',
  main: 'β',
  prefs: 'σ',
  print: 'π',
  project: 'ρ',
  wizard: 'φ'
}

const COLOR = [
  'magenta',
  'cyan',
  'blue',
  'red',
  'redBright',
  'redBright'
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

  return format(log)
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

const transport = new Transform({
  objectMode: true,
  transform(chunk, enc, cb) {
    try {
      cb(null, pretty(chunk.toString()))
    } catch (e) {
      console.error(e)
      cb(e)
    }
  }
})

pump(process.stdin, split(), transport, process.stdout)

if (!process.stdin.isTTY && !fs.fstatSync(process.stdin.fd).isFile()) {
  process.once('SIGINT', () => {})
}
