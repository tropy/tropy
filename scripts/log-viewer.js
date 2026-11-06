#!/usr/bin/env node

import fs from 'node:fs'
import { homedir } from 'node:os'
import { sep } from 'node:path'
import process from 'node:process'
import { Transform } from 'node:stream'
import { inspect, styleText } from 'node:util'
import pump from 'pump'
import split from 'split2'
import ms from 'ms'

const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// The working directory, also as logged relative to home (~).
const CWD = (function (cwd, home) {
  let dirs = [cwd]

  if (cwd.startsWith(home + sep))
    dirs.push('~' + cwd.slice(home.length))

  return new RegExp(`(?:${dirs.map(escape).join('|')}).`, 'g')
})(process.cwd(), homedir())

const format = log =>
  `${header(log)} ${body(log)}${timing(log)}${context(log)}${error(log)}${end(log)}`
    .replace(CWD, '')

// Durations, with the window ready breakdown.
const timing = ({ ms, dom, init, load }) => {
  if (typeof ms !== 'number') return ''

  let steps = (dom == null) ? '' : ` [dom:${dom}ms init:${init}ms load:${load}ms]`
  return ` ${styleText('dim', `${ms}ms${steps}`)}`
}

const end = log =>
  log.quit ? '\n\n' : '\n'

const body = log => {
  if (log.action)
    return `${log.action} ${styleText('dim', meta(log))}`
  else
    return (log.module ? `${log.module}: ` : '') +
      (log.msg || log.message || '??')
}

// The path or URL a message is about.
const context = ({ path, url }) => {
  let value = path ?? url
  return (typeof value === 'string') ? ` ${styleText('dim', value)}` : ''
}

const INDENT = ' '.repeat(11)

const error = ({ err, stack = err?.stack }) => {
  if (stack)
    return '\n' + styleText('dim',
      stack
        .split('\n')
        .map(line => `${INDENT}${line}`)
        .join('\n'))
  else
    return ''
}

const meta = log =>
  log.meta.was ?
    `#${log.meta.seq}(${log.meta.rel}) Δ${ms(log.meta.now - log.meta.was)}` :
    `#${log.meta.seq}`

const header = log =>
  `${seq(log.time)} ${symbol(log)}`

const symbol = log =>
  colorize(log.level, SYMBOL[log.name] ?? '?')

const SYMBOL = {
  about: 'α',
  api: 'λ',
  main: 'β',
  prefs: 'φ',
  print: 'π',
  project: 'ρ'
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
  return (color in inspect.colors) ? styleText(color, text) : text
}

const pretty = input => {
  let log

  if (typeof input === 'string') {
    try {
      log = JSON.parse(input)
    } catch {
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
      return styleText('dim',
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
  transform (chunk, enc, cb) {
    try {
      cb(null, pretty(chunk.toString()))
    } catch (err) {
      console.error(err)
      cb(err)
    }
  }
})

pump(process.stdin, split(), transport, process.stdout)

if (!process.stdin.isTTY && !fs.fstatSync(process.stdin.fd).isFile()) {
  process.once('SIGINT', () => {})
}
