import { spawn } from 'node:child_process'
import { createWriteStream, existsSync } from 'node:fs'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { arch, env, platform } from 'node:process'
import { after, afterEach, before } from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import electron from 'electron'
import { qualified } from '#tropy/common/release.js'

export const ROOT = join(import.meta.dirname, '..', '..')
export const fixture = (...parts) => join(ROOT, 'test', 'fixtures', ...parts)

const DIST = env.npm_lifecycle_event === 'test:e2e:dist'

function command () {
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

const PORT = 10816

// Starts Tropy in hidden mode for the tests of a file,
// and quits it afterwards. Keeps the run's folder if a test failed.
export function useTropy ({ timeout = 30000 } = {}) {
  let tropy = new Tropy()
  let failed = false

  before(async () => {
    try {
      await tropy.launch({ timeout })
    } catch (err) {
      failed = true
      throw err
    }
  }, { timeout })
  afterEach((t) => { if (!t.passed) failed = true })
  after(async () => {
    if (tropy.root == null) return

    await tropy.quit()

    if (failed || tropy.exitCode !== 0)
      console.log(`# kept ${tropy.root}`)
    else
      await rm(tropy.root, { recursive: true, force: true })
  }, { timeout })

  return tropy
}

export class Tropy {
  async launch ({ timeout }) {
    let [cmd, prefix] = command()
    console.log(`# ${DIST ? 'packaged app' : 'repository app'}: ${cmd}`)

    if (!existsSync(cmd))
      throw new Error(`no app at ${cmd}: run npm run build first?`)

    this.root = await mkdtemp(join(tmpdir(), 'tropy-e2e-'))

    this.proc = this.#spawn(cmd, [
      ...prefix,
      '--hidden',
      `--port=${PORT}`
    ])

    // A crash by signal has no exit code.
    this.exitCode = null
    this.exited = new Promise(resolve => {
      this.proc.once('exit', (code, signal) => {
        this.exitCode = code ?? signal
        resolve()
      })
    })

    let deadline = Date.now() + timeout

    while (Date.now() < deadline) {
      if (this.exitCode != null)
        throw new Error(`exited on launch: ${this.exitCode}`)

      try {
        if ((await this.api('/')).status === 200) return this
      } catch {
        // Not listening yet.
      }

      await delay(250)
    }

    throw new Error('timed out waiting for the API')
  }

  #spawn (cmd, args) {
    let out = createWriteStream(join(this.root, 'app.out'), { flags: 'a' })
    let proc = spawn(cmd, [
      ...args,
      `--data=${this.data}`,
      `--logs=${this.logs}`,
      `--cache=${join(this.root, 'cache')}`,
      // Keeps safeStorage from prompting for the keychain (macOS)
      // or keyring (Linux); each switch is ignored elsewhere.
      '--use-mock-keychain',
      '--password-store=basic',
      // Unpacked Electron has no setuid sandbox helper.
      ...(platform === 'linux' ? ['--no-sandbox'] : [])
    ], { stdio: ['ignore', 'pipe', 'pipe'] })

    proc.stdout.pipe(out)
    proc.stderr.pipe(out)

    return proc
  }

  get data () {
    return join(this.root, 'data')
  }

  get logs () {
    return join(this.root, 'log')
  }

  path (...parts) {
    return join(this.root, ...parts)
  }

  // Quits through a second launch (tropy --quit), like a user would;
  // kills the app if it does not exit in time.
  async quit ({ timeout = 20000 } = {}) {
    if (this.proc == null || this.exitCode != null) return

    let [cmd, prefix] = command()
    let quitter = this.#spawn(cmd, [...prefix, '--quit'])
    let timedOut = delay(timeout, 'timeout', { ref: false })

    if (await Promise.race([this.exited, timedOut]) === 'timeout') {
      quitter.kill('SIGKILL')
      this.proc.kill('SIGKILL')
      await this.exited
      this.exitCode = 'killed'
    }
  }

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
  }

  // The log entries (JSON lines) of the main and renderer processes.
  async log () {
    let text = await readFile(join(this.logs, 'tropy.log'), 'utf-8')
    return text.split('\n').filter(Boolean).map(line => JSON.parse(line))
  }

  // Entries at level error (50) or fatal (60).
  async errors () {
    return (await this.log()).filter(entry => entry.level >= 50)
  }

  async state () {
    return JSON.parse(await readFile(join(this.data, 'state.json'), 'utf-8'))
  }

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
