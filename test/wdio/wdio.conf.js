import { join } from 'node:path'
import { arch, platform } from 'node:process'
import { mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'

import { qualified } from '../../src/common/release.js'
import { version } from '../../node_modules/electron/package.json' with { type: 'json' }

const ROOT = join(import.meta.dirname, '..', '..')
const DATA = join(tmpdir(), 'tropy-wdio')
const DIST = join(ROOT, 'dist', `${qualified.product}-${platform}-${arch}`)

mkdirSync(DATA, { recursive: true })

function getAppBinaryPath () {
  switch (platform) {
    case 'darwin':
      return join(DIST, `${qualified.product}.app`, 'Contents', 'MacOS', qualified.product)
    case 'win32':
      return join(DIST, `${qualified.name}.exe`)
    case 'linux':
      return join(DIST, qualified.name)
  }
}

export const config = {
  runner: 'local',
  specs: ['./spec/**/*.test.js'],
  maxInstances: 1,

  capabilities: [{
    browserName: 'electron',
    browserVersion: version,
    'wdio:electronServiceOptions': {
      appBinaryPath: getAppBinaryPath(),
      appArgs: [
        `--data=${DATA}`,
        `--logs=${join(DATA, 'log')}`,
        `--cache=${join(DATA, 'cache')}`
      ]
    },
    'goog:chromeOptions': {
      args: [`--user-data-dir=${join(DATA, 'electron')}`]
    }
  }],

  services: ['electron'],
  framework: 'mocha',
  reporters: ['spec'],

  mochaOpts: {
    ui: 'bdd',
    timeout: 30000
  },

  waitforTimeout: 10000,

  onPrepare () {
    rmSync(DATA, { recursive: true, force: true })
    mkdirSync(DATA, { recursive: true })
  },

  onComplete (exitCode) {
    if (exitCode === 0) {
      rmSync(DATA, { recursive: true, force: true })
    }
  }
}
