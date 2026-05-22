import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { platform } from 'node:process'
import { ShellOption } from '#tropy/main/win-shell.js'

describe('ShellOption', {
  skip: platform === 'win32' ? false : 'win32 only'
}, () => {
  const PATH = `\\Software\\Tropy\\Test\\${randomUUID()}`

  afterEach(() => (
    (new ShellOption(PATH)).clear().catch(() => {})
  ))

  it('register() and clear() round-trip through the registry', async () => {
    let opt = new ShellOption(`${PATH}\\app`, [
      { name: 'Path', value: 'C:\\tropy' },
      { value: 'default-data' },
      { key: 'shell\\open\\command', value: '"tropy.exe" "%1"' }
    ])

    await opt.register()
    await opt.clear()
    await assert.rejects(() => opt.clear())
  })
})
