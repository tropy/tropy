#!/usr/bin/env node

import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from './util.js'

export const clean = (...paths) => {
  for (let path of paths)
    rmSync(join(ROOT, path), { recursive: true, force: true })
}

if (import.meta.main)
  clean('coverage', 'doc', 'dist', 'lib', 'npm-debug.log')
