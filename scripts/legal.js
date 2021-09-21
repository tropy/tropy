'use strict'

const { bail, say, warn } = require('./util')('§')
const { join, relative, resolve } = require('path')
const { readFile, writeFile } = require('fs/promises')
const { program } = require('commander')

const fetch = (...args) =>
  import('node-fetch').then(f => f.default(...args))

/* eslint-disable max-len */

program
  .name('tropy-legal')
  .option('-d, --dependencies <files...>', 'dependencies (JSON)')
  .option('-o, --out <directory>', 'output directory')
  .option('-n, --name <basename>', 'output file name', 'third-party-notices')
  .option('-f, --format <format>', 'output format', 'html')
  .action(async () => {
    let opts = program.opts()
    let deps = await loadDependencies(opts)

    let out = join(opts.out || process.cwd(), `${opts.name}.${opts.format}`)
    await writeFile(out, compileThirdPartyNotices(deps, opts))

    say(`${deps.length} dependencies saved to ${relative(process.cwd(), out)}`)
  })


const compileThirdPartyNotices = (deps, { format }) => {
  switch (format) {
    case 'json':
      return JSON.stringify(deps, 0, 2)
    case 'html':
      return deps.map(htmlTemplate).join('\n')
    case 'txt':
      return deps.map(textTemplate).join('\n')
    default:
      bail(`unknown format: "${format}"`)
  }
}

const loadDependencies = async ({ dependencies } = {}) => {
  if (dependencies) {
    dependencies = dependencies.map(dep => resolve(dep))
  } else {
    dependencies = [
      join(__dirname, 'licenses.json'),
      resolve('lib/licenses.browser.json'),
      resolve('lib/licenses.renderer.json'),
      resolve('lib/licenses.libvips.json')
    ]
  }

  let mods = []
  let dict = {}

  let skip = (name) =>
    name == null || name === 'tropy' || dict[name]

  for (let file of dependencies) {
    try {
      for (let mod of JSON.parse(await readFile(file))) {
        if (!skip(mod.name)) {
          await loadLicenseText(mod)
          mods.push(mod)
          dict[mod.name] = true
        }
      }
    } catch (e) {
      warn(`failed loading dependencies from "${file}"`)
      console.error(e.stack)
    }
  }

  mods.sort(byName)

  return mods
}

const byName = (a, b) => {
  let n1 = normalizeName(a.name)
  let n2 = normalizeName(b.name)
  return (n1 < n2) ? -1 : (n1 > n2) ? 1 : 0
}

const normalizeName = (name) =>
  name.replace('@', '').toLowerCase()

const base64 = /^[-a-zA-Z0-9+/]*={0,3}$/

const loadLicenseText = async (mod) => {
  if (!mod.licenseText) {
    let text = []

    for (let url of [mod.licenseURL].flat()) {
      if (!url) continue

      let result = await fetch(url).then(res => res.text())
      if (base64.test(result))
        result = Buffer.from(result, 'base64').toString()

      text.push(result)
    }

    mod.licenseText = text.join(
      '\n\n              + + + + + + + + + + + + + + + + + + + + + + + + +\n\n'
    )
  }

  return mod
}

const textTemplate = (mod) => `
${mod.name}
------------------------------------------------------------------------------
${[
  mod.licenseText || `License: ${mod.license || 'Unknown'}`,
  mod.licenseNote
].filter(x => x).join('\n\n')}
------------------------------------------------------------------------------
`

const htmlTemplate = (mod) => html`
<div class="dependency"><a href="#" class="module">${mod.name}</a><div class="license">
  <pre>
${[
  mod.licenseText || `License: ${mod.license || 'Unknown'}`,
  mod.licenseNote
].filter(x => x).join('\n\n')}
  </pre></div>
</div>`

const html = (lit, ...subs) => {
  let fragment = ''
  let raw = lit.raw

  subs.forEach((sub, i) => {
    fragment += raw[i] + htmlEscape(sub)
  })

  fragment += raw[raw.length - 1]

  return fragment
}

const htmlEscape = (str) =>
  (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&39;')
    .replace(/`/g, '&96;')

if (require.main === module) {
  program.parseAsync(process.argv)
} else {
  module.exports = {
    compileThirdPartyNotices,
    loadDependencies
  }
}
