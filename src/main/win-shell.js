import { dirname, basename, join } from 'node:path'
import { spawn } from '../common/spawn.js'

const HKCU = 'HKCU'
const DEFAULT_VALUE = ''
const REG_SZ = 'REG_SZ'
const REG_NONE = 'REG_NONE'

const REG_EXE = join(process.env.windir, 'system32', 'reg.exe')

export class ShellOption {
  constructor (key, parts = [], hive = HKCU) {
    this.hive = hive
    this.key = key
    this.parts = parts
  }

  async clear () {
    await reg('delete', `${this.hive}${this.key}`)
  }

  async register () {
    for (let part of this.parts) {
      let path = `${this.hive}${this.key}`

      if (part.key != null) {
        path += `\\${part.key}`
      }

      await reg('add', path,
        part.name ?? DEFAULT_VALUE,
        part.type ?? REG_SZ,
        part.value)
    }
  }

  // See https://docs.microsoft.com/en-us/windows/win32/shell/app-registration

  static forAppPath (exe) {
    return new ShellOption(
      `\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\${basename(exe)}`,
      [{ name: 'Path', value: `${dirname(exe)}` }, { value: exe }]
    )
  }

  static forApplication (exe, icon, types = []) {
    let key = `\\Software\\Classes\\Applications\\${basename(exe)}`
    let parts = [
      { key: 'shell\\open\\command', value: `"${exe}" "%1"` }
    ]

    if (icon) {
      parts.push({
        key: 'DefaultIcon',
        value: icon
      })
    }

    for (let name of types) {
      parts.push({
        key: 'SupportedTypes',
        name,
        type: REG_NONE,
        value: ''
      })
    }

    return new ShellOption(key, parts)
  }

  // See https://docs.microsoft.com/en-us/windows/win32/shell/fa-file-types

  static forProgId (id, exe, icon) {
    let key = `\\Software\\Classes\\${id}`
    let parts = [
      { key: 'shell\\open\\command', value: `"${exe}" "%1"` }
    ]

    if (icon) {
      parts.push({
        key: 'DefaultIcon',
        value: icon
      })
    }

    return new ShellOption(key, parts)
  }

  static forFileExtension (ext, progId, mimetype) {
    let key = `\\Software\\Classes\\${ext}`
    let parts = [
      { value: progId }
    ]

    if (mimetype) {
      parts.push({
        name: 'Content Type',
        value: mimetype
      })
    }

    // HACK inexplicably, the key's default value was not set
    // in the registry reliably if set right after creating
    // the key. reg.exe reports no issues and this works fine
    // for other keys. Here we just set the default value twice
    // for good measure!
    parts.push({ value: progId })

    return new ShellOption(key, parts)
  }
}


async function reg (cmd, path, ...rest) {
  let args

  switch (cmd) {
    case 'delete':
      args = ['DELETE', path, '/f']
      break
    case 'add': {
      let [name, type, value] = rest
      args = ['ADD', path]

      if (name === '')
        args.push('/ve')
      else
        args.push('/v', name)

      args.push('/t', type, '/d', value, '/f')
      break
    }
    default:
      throw new Error(`unknown reg command: ${cmd}`)
  }

  await spawn(REG_EXE, args)
}
