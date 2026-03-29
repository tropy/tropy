#!/usr/bin/env node

import fs from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { mkdir } from 'node:fs/promises'
import { pipeline } from 'node:stream/promises'
import process from 'node:process'
import { Transform } from 'node:stream'
import { execSync } from 'node:child_process'
import { parseArgs } from 'node:util'
import pump from 'pump'
import split from 'split2'
import { SourceMapConsumer } from 'source-map-js'


const FRAME = /^(\s+at\s+(?:.*?\s+\()?)(?:file:\/\/)?(.+?):(\d+):(\d+)(\)?)\s*$/
const RELEASES = 'https://github.com/tropy/tropy/releases/download'
const CACHE = new Map()

const { values: ARGS } = parseArgs({
  options: {
    sourcemaps: {
      type: 'string',
      short: 's'
    },
    fetch: {
      type: 'boolean',
      default: false,
      short: 'f'
    },
    verbose: {
      type: 'boolean',
      default: false,
      short: 'v'
    }
  }
})

ARGS.sourcemaps = resolve(
  ARGS.sourcemaps || (ARGS.fetch ? 'tmp/sourcemaps' : 'lib')
)

const transform = new Transform({
  objectMode: true,
  transform (chunk, enc, cb) {
    cb(null, remap(chunk.toString()) + '\n')
  }
})

if (ARGS.fetch) {
  await processFirstLine()
}

pump(process.stdin, split(), transform, process.stdout)

if (!process.stdin.isTTY && !fs.fstatSync(process.stdin.fd).isFile()) {
  process.once('SIGINT', () => {})
}


// --- Functions

function debug (msg) {
  if (ARGS.verbose) {
    process.stderr.write(`${msg}\n`)
  }
}

async function fetchSourceMaps (target, { version, platform, arch }) {
  let asset = `tropy-${version}-sourcemaps-${platform}-${arch}.tar.gz`
  let url = `${RELEASES}/v${version}/${asset}`
  let dest = join(target, `${asset}`)

  await mkdir(target, { recursive: true })

  debug(`fetching ${url}`)

  let res = await fetch(url)
  if (!res.ok) {
    debug(`fetch failed: ${res.status} ${res.statusText}`)
    return
  }

  await pipeline(res.body, fs.createWriteStream(dest))

  debug(`extracting to ${target}`)
  execSync(`tar -xzf "${dest}" -C "${target}"`, {
    stdio: ARGS.verbose ? 'inherit' : 'ignore'
  })
}

function loadSourceMap (bundle, type) {
  let proc = type === 'browser' ? 'main' : ''

  try {
    return JSON.parse(
      fs.readFileSync(join(ARGS.sourcemaps, proc, bundle + '.map'), 'utf-8')
    )
  } catch {
    return null
  }
}

function getConsumer (bundle, type) {
  let key = `${type}:${bundle}`

  if (CACHE.has(key))
    return CACHE.get(key)

  let raw = loadSourceMap(bundle, type)
  let consumer = raw ? new SourceMapConsumer(raw) : null

  CACHE.set(key, consumer)
  return consumer
}

function remapStack (stack, type) {
  return stack
    .split('\n')
    .map(frame => {
      let m = frame.match(FRAME)
      if (!m) return frame

      let [, prefix, file, line, column, suffix] = m
      let consumer = getConsumer(basename(file), type)

      if (!consumer) return frame

      let pos = consumer.originalPositionFor({
        line: Number(line),
        column: Number(column)
      })

      if (!pos.source) return frame

      let source = pos.source.replace(/^(\.\.\/)+/, '')
      return `${prefix}${source}:${pos.line}:${pos.column}${suffix}`
    })
    .join('\n')
}

function remap (input) {
  let line

  if (typeof input === 'string') {
    try {
      line = JSON.parse(input)
    } catch {
      return input
    }
  } else {
    line = input
  }

  if (line.err?.stack) {
    line.err.stack = remapStack(line.err.stack, line.type)
  }

  return JSON.stringify(line)
}

function readFirstLine () {
  return new Promise((resolve, reject) => {
    let buf = ''
    let onData = (chunk) => {
      buf += chunk
      let i = buf.indexOf('\n')
      if (i >= 0) {
        process.stdin.removeListener('data', onData)
        process.stdin.removeListener('end', onEnd)
        process.stdin.pause()
        if (i + 1 < buf.length) {
          process.stdin.unshift(Buffer.from(buf.slice(i + 1)))
        }
        resolve(buf.slice(0, i))
      }
    }
    let onEnd = () => {
      process.stdin.removeListener('data', onData)
      reject(new Error('stdin ended before first newline'))
    }
    process.stdin.setEncoding('utf-8')
    process.stdin.on('data', onData)
    process.stdin.once('end', onEnd)
    process.stdin.resume()
  })
}

async function processFirstLine () {
  try {
    var firstLine = await readFirstLine()
    let { version, platform, arch } = JSON.parse(firstLine)

    if (version && platform && arch) {
      let target = ARGS.sourcemaps
      ARGS.sourcemaps = join(ARGS.sourcemaps, version)
      try {
        fs.statSync(ARGS.sourcemaps)
        debug(`sourcemaps cached at ${ARGS.sourcemaps}`)
      } catch {
        await fetchSourceMaps(target, { version, platform, arch })
      }
    } else {
      debug('cannot fetch: missing version, platform, or arch in log')
    }
  } catch (err) {
    debug(`cannot fetch: ${err.message}`)
  } finally {
    if (firstLine) transform.write(firstLine)
  }
}
