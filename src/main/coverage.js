import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { app } from 'electron'
import { warn } from '../common/log.js'

/*
 * To collect code coverage in e2e tests,
 * we need to enable coverage collection via the Debugger,
 * because Chromium ignores NODE_V8_COVERAGE
 */

export function startCoverage (webContents) {
  let dir = process.env.NODE_V8_COVERAGE
  if (!dir || app.getAppPath().endsWith('.asar')) return

  let dbg = webContents.debugger
  let started = (async () => {
    dbg.attach()
    await dbg.sendCommand('Profiler.enable')
    await dbg.sendCommand('Profiler.startPreciseCoverage', {
      callCount: true,
      detailed: true
    })
    return true
  })().catch(err => {
    warn({ err }, 'failed to start window coverage')
  })

  return async () => {
    if (!await started) return
    try {
      let { result } = await dbg.sendCommand('Profiler.takePreciseCoverage')
      await mkdir(dir, { recursive: true })
      await writeFile(
        join(dir, `coverage-${process.pid}-${Date.now()}-${webContents.id}.json`),
        JSON.stringify({ result }))
    } catch (err) {
      warn({ err }, 'failed to write window coverage')
    }
  }
}
