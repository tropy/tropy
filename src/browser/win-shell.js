import { dirname, basename } from 'path'
import Registry from 'winreg'

const { HKCU, DEFAULT_VALUE, REG_NONE, REG_SZ } = Registry

export class ShellOption {
  constructor(key, parts = [], hive = HKCU) {
    this.hive = hive
    this.key = key
    this.parts = parts
  }

  async clear() {
    await exec({ hive: this.hive, key: this.key }, 'destroy')
  }

  async register() {
    for (let part of this.parts) {
      let reg = new Registry({
        hive: this.hive,
        key: part.key != null ? `${this.key}\\${part.key}` : this.key
      })

      await exec(reg, 'create')
      await exec(reg, 'set',
        part.name ?? DEFAULT_VALUE,
        part.type ?? REG_SZ,
        part.value)
    }
  }

  // See https://docs.microsoft.com/en-us/windows/win32/shell/app-registration

  static forAppPath(exe) {
    return new ShellOption(
      `\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\${basename(exe)}`,
      [{ name: 'Path', value: `${dirname(exe)}` }, { value: exe }]
    )
  }

  static forApplication(exe, icon, types = []) {
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

  static forProgId(id, exe, icon) {
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

  static forFileExtension(ext, progId, mimetype) {
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

    // HACK inexpicably, the key's default value was not set
    // in the registry reliably if set right after creating
    // the key. reg.exe reports no issues and this works fine
    // for other keys. Here we just set the default value twice
    // for good measure!
    parts.push({ value: progId })

    return new ShellOption(key, parts)
  }
}


function exec(reg, cmd, ...args) {
  return new Promise((resolve, reject) => {
    if (!(reg instanceof Registry))
      reg = new Registry(reg)

    reg[cmd](...args, (e, ...res) => {
      if (e != null)
        reject(new Error(
          `Windows Registry error: ${cmd} "${args}": ${e.message}`
        ))
      else
        resolve(...res)
    })
  })
}
