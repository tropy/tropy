import { spawn } from 'node:child_process'
import { createWriteStream, existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { env, platform } from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import { product, version } from '#tropy/common/release.js'
import { DIST, PORT, command, tropy } from './support.js'

let proc
let exited
let exitCode = null

function start (cmd, args) {
  let out = createWriteStream(tropy.path('app.out'), { flags: 'a' })
  let child = spawn(cmd, [
    ...args,
    `--data=${tropy.data}`,
    `--logs=${tropy.logs}`,
    `--cache=${tropy.path('cache')}`,
    '--use-mock-keychain',
    '--password-store=basic',
    // Unpacked Electron has no setuid sandbox helper.
    ...(platform === 'linux' ? ['--no-sandbox'] : [])
  ], { stdio: ['ignore', 'pipe', 'pipe'] })

  child.stdout.pipe(out)
  child.stderr.pipe(out)

  return child
}

export async function globalSetup ({ timeout = 30000 } = {}) {
  let [cmd, prefix] = command()
  console.log(`# ${DIST ? 'packaged app' : 'dev app'}: ${cmd}`)

  if (!existsSync(cmd))
    throw new Error(`no app at ${cmd}: run npm run build first?`)

  // The scenarios run in child processes: they find the run here.
  env.TROPY_E2E_ROOT = await mkdtemp(join(tmpdir(), 'tropy-e2e-'))

  proc = start(cmd, [...prefix, '--hidden', `--port=${PORT}`])
  exited = new Promise(resolve => {
    proc.once('exit', (code, signal) => {
      // A crash by signal has no exit code.
      exitCode = code ?? signal
      resolve()
    })
  })

  let deadline = Date.now() + timeout

  while (Date.now() < deadline) {
    if (exitCode != null)
      throw new Error(`exited on launch: ${exitCode}`)

    // Null while not listening yet.
    let res = await tropy.api('/').catch(() => null)

    if (res?.status === 200) {
      let { name, version: v } = res.body

      if (name !== product || v !== version) {
        proc.kill('SIGKILL')
        throw new Error(`not ${product} ${version} on port ${PORT}: ${name} ${v}`)
      }

      return
    }

    await delay(250)
  }

  proc.kill('SIGKILL')
  throw new Error('timed out waiting for the API')
}

async function quit (timeout = 20000) {
  if (proc == null || exitCode != null) return

  let [cmd, prefix] = command()
  let quitter = start(cmd, [...prefix, '--quit'])

  if (await Promise.race([
    exited,
    delay(timeout, 'timeout', { ref: false })
  ]) === 'timeout') {
    quitter.kill('SIGKILL')
    proc.kill('SIGKILL')
    await exited
    exitCode = 'killed'
  }
}

export async function globalTeardown () {
  if (env.TROPY_E2E_ROOT == null) return

  await quit()

  let problems = []
  let fail = (message) => problems.push(message)

  if (exitCode !== 0)
    fail(`exit code ${exitCode}`)

  try {
    for (let entry of await tropy.errors())
      fail(`log: ${entry.msg}`)

    for (let report of await tropy.crashes())
      fail(`crash report ${report}`)
  } catch (err) {
    fail(err.message)
  }

  for (let problem of problems)
    console.error(`# ${problem}`)

  if (problems.length > 0)
    process.exitCode = 1

  if (process.exitCode)
    console.error(`# kept ${tropy.root}`)
  else
    await rm(tropy.root, { recursive: true, force: true })
}
