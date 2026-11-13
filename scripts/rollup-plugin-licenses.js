import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'

// Writes name, version, license and license text of every package
// with code in the bundle to file (as JSON), for scripts/legal.js.
export default function licenses ({ file }) {
  let root = process.cwd()
  let packages = new Map() // dir -> package or null
  let deps = new Map() // name@version -> dependency

  // Returns the package of the module with id: the nearest package.json
  // with a name and version (or license), not counting our own.
  let lookup = (id) => {
    let dir = dirname(resolve(id.replace(/^\0/, '')))
    let scanned = []
    let pkg = null

    while (dir !== root && !packages.has(dir)) {
      scanned.push(dir)
      let path = join(dir, 'package.json')

      if (existsSync(path)) {
        let json = JSON.parse(readFileSync(path, 'utf-8'))

        if ((json.name && json.version) || json.license || json.licenses) {
          pkg = {
            name: json.name ?? null,
            version: json.version ?? null,
            license: license(json),
            licenseText: licenseText(dir)
          }
          break
        }
      }

      let parent = dirname(dir)
      if (parent === dir) break
      dir = parent
    }

    pkg ??= packages.get(dir) ?? null
    for (let d of scanned) packages.set(d, pkg)

    return pkg
  }

  return {
    name: 'licenses',

    renderStart () {
      deps.clear()
    },

    renderChunk (code, chunk) {
      for (let [id, mod] of Object.entries(chunk.modules)) {
        if (mod.renderedLength === 0 || id.startsWith('virtual:'))
          continue

        let pkg = lookup(id)
        if (pkg) deps.set(`${pkg.name}@${pkg.version}`, pkg)
      }

      return null
    },

    generateBundle () {
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, JSON.stringify([...deps.values()]))
    }
  }
}

// The deprecated `licenses` field is an array of { type } objects.
function license ({ license, licenses }) {
  if (license) return license
  if (licenses) return `(${[licenses].flat().map(l => l.type ?? l).join(' OR ')})`
  return null
}

// The first file starting with license (or licence), case-insensitive.
function licenseText (dir) {
  let names = readdirSync(dir)

  for (let pattern of [/^license/i, /^licence/i]) {
    let name = names.find(n => pattern.test(n))
    if (name) {
      try {
        return readFileSync(join(dir, name), 'utf-8')
      } catch {
        // Not a readable file, e.g. a directory.
      }
    }
  }

  return null
}
