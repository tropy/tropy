import { execFileSync, spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Transform } from 'node:stream'
import { StringDecoder } from 'node:string_decoder'
import { styleText } from 'node:util'

export const ROOT = join(import.meta.dirname, '..')

const UNITS = [['d', 864e5], ['h', 36e5], ['m', 6e4], ['s', 1e3]]

// Formats ms as a short duration, e.g. 250ms, 3s, 2m, 1h.
export const duration = (ms) => {
  for (let [unit, size] of UNITS)
    if (Math.abs(ms) >= size) return `${Math.round(ms / size)}${unit}`

  return `${Math.round(ms)}ms`
}

// Splits a byte stream into lines (strings).
export const lines = () => {
  let decoder = new StringDecoder('utf8')
  let rest = ''

  return new Transform({
    readableObjectMode: true,
    transform (chunk, _, cb) {
      let parts = (rest + decoder.write(chunk)).split(/\r?\n/)
      rest = parts.pop()
      for (let line of parts) this.push(line)
      cb()
    },
    flush (cb) {
      rest += decoder.end()
      if (rest) this.push(rest)
      cb()
    }
  })
}
export const ICONS = join(ROOT, 'res', 'icons')

export const download = async (url, file) => {
  let res = await fetch(url)
  if (!res.ok)
    throw new Error(`download failed: ${url} ${res.status} ${res.statusText}`)

  await writeFile(file, new Uint8Array(await res.arrayBuffer()))
}

// Runs cmd and resolves when it exits with 0. Output goes to the
// console unless silent; options are passed to spawn (cwd, shell…).
export const run = (cmd, args = [], { silent, ...options } = {}) =>
  new Promise((resolve, reject) => {
    let stderr = ''
    let child = spawn(cmd, args, {
      stdio: silent ? ['ignore', 'ignore', 'pipe'] : 'inherit',
      ...options
    })

    child.stderr?.on('data', data => { stderr += data })
    child.on('error', reject)
    child.on('close', code => {
      if (code === 0)
        resolve()
      else
        reject(new Error(`${[cmd, ...args].join(' ')} failed (${code}) ${stderr}`.trim()))
    })
  })

// Applies [pattern, replacement] pairs to the contents of file
// (like sed -i; use the m flag for ^ and $ to match per line).
export const sed = (file, ...pairs) => {
  let text = readFileSync(file, 'utf-8')
  for (let [pattern, replacement] of pairs)
    text = text.replace(pattern, replacement)
  writeFileSync(file, text)
}

// Extracts the gzipped tarball file into dest.
// Extra args are passed to tar, e.g. members to extract.
export const untar = (file, dest, ...args) => {
  execFileSync('tar', ['-xzf', file, '-C', dest, ...args], {
    stdio: ['ignore', 'ignore', 'pipe']
  })
}

export let logSymbol = null
export const setLogSymbol = (ls) => {
  logSymbol = ls
}

const COLOR = {
  warn: 'yellow',
  error: 'red',
  red: 'red',
  green: 'green',
  log: 'blue'
}

const colorize = (level, text) =>
  styleText(COLOR[level] || 'dim', text || level)

const seq = (function * (prev = Date.now(), padding = 8) {
  while (true) {
    let now = Date.now()
    yield styleText('dim', (`+${duration(now - prev)}`).padStart(padding, ' '))
    prev = now
  }
})()

const format = (msg, level, prefix) =>
  (prefix) ?
    `${seq.next().value} ${colorize(level, prefix)} ${msg}` :
    `  ${msg}`

export const say = (...args) =>
  print('log', ...args)

export const error = (...args) =>
  print('error', ...args)

export const warn = (...args) =>
  print('warn', ...args)

export const check = (predicate, msg = 'assertion failed', ...args) => {
  if (!predicate) bail(msg, ...args)
}

export const bail = (...args) => {
  error(...args)
  process.exit(1)
}

const print = (level = 'log', msg, ...args) => {
  console[level](format(msg, level, logSymbol), ...args)
}

export const red = (msg, ...args) =>
  console.log(format(msg, 'red', logSymbol), ...args)

export const green = (msg, ...args) =>
  console.log(format(msg, 'green', logSymbol), ...args)
