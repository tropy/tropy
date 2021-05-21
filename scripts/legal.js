'use strict'

const { bail, say } = require('./util')('§')
const { join, relative, resolve } = require('path')
const { readFile, writeFile } = require('fs/promises')
const { program } = require('commander')

/* eslint-disable max-len */

program
  .name('tropy-legal')
  .option('-m, --modules <files...>', 'module dependencies (JSON)')
  .option('-l, --libraries <files...>', 'library dependencies (JSON)')
  .option('-o, --out <directory>', 'output directory')
  .option('-f, --format <format>', 'output format', 'html')
  .action(async () => {
    let opts = program.opts()

    if (opts.dependencies) {
      opts.dependencies = opts.dependencies.map(dep => resolve(dep))
    } else {
      opts.dependencies = [
        join(__dirname, 'licenses.browser.json'),
        join(__dirname, 'licenses.renderer.json')
      ]
    }

    if (opts.libraries) {
      opts.libraries = opts.libraries.map(lib => resolve(lib))
    } else {
      opts.libraries = [
        join(__dirname, 'libraries.json'),
        join(__dirname, '../../sharp-libvips/THIRD-PARTY-NOTICES.json')
      ]
    }

    let deps = await loadDependencies(opts.dependencies)
    let libs = await loadDependencies(opts.libraries)

    let modules
    let libraries

    switch (opts.format) {
      case 'json':
        modules = JSON.stringify(deps, 0, 2)
        libraries = JSON.stringify(libs, 0, 2)
        break
      case 'html':
        modules = deps.map(modTemplate).join('\n')
        libraries = libs.map(libTemplate).join('\n')
        break
      default:
        bail(`unknown format: "${opts.format}"`)
    }

    let target = join(opts.out || process.cwd(), `modules.${opts.format}`)
    await writeFile(target, modules)

    say(`${deps.length} modules saved to ${relative(process.cwd(), target)}`)

    target = join(opts.out || process.cwd(), `libraries.${opts.format}`)
    await writeFile(target, libraries)

    say(`${libs.length} libraries saved to ${relative(process.cwd(), target)}`)
  })

const loadDependencies = async (files) => {
  let modules = []
  let dict = {}

  let skip = (name) =>
    name == null || name === 'tropy' || dict[name]

  for (let file of files) {
    for (let module of JSON.parse(await readFile(file))) {
      if (!skip(module.name)) {
        modules.push(module)
        dict[module.name] = module
      }
    }
  }

  modules.sort((a, b) =>
    (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0
  )

  return modules
}

const libTemplate = (library) =>
  `<a href="${library.url}">${library.name}</a>`

const modTemplate = (module) => html`
<div class="dependency"><a href="#" class="module">${module.name}</a><div class="license">
  <pre>
${module.licenseText || `License: ${module.license || 'Unknown'}`}
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
}
