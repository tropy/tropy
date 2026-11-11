import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { arch, env, platform } from 'node:process'
import electron from 'electron'
import { qualified } from '#tropy/common/release.js'

export const ROOT = join(import.meta.dirname, '..', '..')
export const fixture = (...parts) => join(ROOT, 'test', 'fixtures', ...parts)

export function checkProject (path) {
  let db = new DatabaseSync(path)
  let problems = []

  try {
    for (let { integrity_check: msg } of db.prepare('PRAGMA integrity_check').all())
      if (msg !== 'ok') problems.push(msg)

    for (let { table, rowid, parent } of db.prepare('PRAGMA foreign_key_check').all())
      problems.push(`${table} ${rowid} references a missing ${parent}`)

    for (let fts of ['fts_notes', 'fts_metadata', 'fts_transcriptions']) {
      try {
        db.exec(`INSERT INTO ${fts}(${fts}, rank) VALUES ('integrity-check', 1)`)
      } catch (err) {
        problems.push(`${fts}: ${err.message}`)
      }
    }
  } finally {
    db.close()
  }

  return problems
}

export const DIST = env.npm_lifecycle_event === 'test:e2e:dist'
export const PORT = 10816

export function command () {
  if (!DIST)
    return [electron, ['--app', ROOT]]

  let dist = join(ROOT, 'dist', `${qualified.product}-${platform}-${arch}`)

  switch (platform) {
    case 'darwin':
      return [join(dist, `${qualified.product}.app`, 'Contents', 'MacOS', qualified.product), []]
    case 'win32':
      return [join(dist, `${qualified.name}.exe`), []]
    default:
      return [join(dist, qualified.name), []]
  }
}

export const tropy = {
  get root () {
    if (env.TROPY_E2E_ROOT == null)
      throw new Error('no app: run npm run test:e2e (with setup.js)')

    return env.TROPY_E2E_ROOT
  },

  get data () {
    return join(this.root, 'data')
  },

  get logs () {
    return join(this.root, 'log')
  },

  // For shared test projects
  path (...parts) {
    return join(this.root, ...parts)
  },

  async api (path, { method = 'GET', body } = {}) {
    let res = await fetch(`http://127.0.0.1:${PORT}${path}`, {
      method,
      headers: (body == null) ? {} : { 'content-type': 'application/json' },
      body: (body == null) ? undefined : JSON.stringify(body)
    })

    let type = res.headers.get('content-type') ?? ''

    return {
      status: res.status,
      body: type.includes('json') ? await res.json() : await res.text()
    }
  },

  // The log entries (JSON lines) of the main and renderer processes.
  async log () {
    let text = await readFile(join(this.logs, 'tropy.log'), 'utf-8')
    return text.split('\n').filter(Boolean).map(line => JSON.parse(line))
  },

  // Entries at level error (50) or fatal (60).
  async errors () {
    return (await this.log()).filter(entry => entry.level >= 50)
  },

  async state () {
    return JSON.parse(await readFile(join(this.data, 'state.json'), 'utf-8'))
  },

  // Crash reports in the data folder (Crashpad), if any.
  async crashes () {
    let reports = []

    for (let dir of ['completed', 'pending']) {
      try {
        reports.push(...await readdir(join(this.data, 'electron', 'Crashpad', dir)))
      } catch (err) {
        if (err.code !== 'ENOENT') throw err
      }
    }

    return reports
  }
}
