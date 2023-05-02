#!/usr/bin/env node
'use strict'

const { bail, say, warn } = require('./util')('μ')
const { join } = require('path')
const yaml = require('js-yaml')
const { program } = require('commander')

const {
  readdirSync: ls,
  readFileSync: read,
  writeFileSync: write,
  unlinkSync: rm
} = require('fs')

const HOME = join(__dirname, '..')
const MENU = join(HOME, 'res', 'menu')
const STRINGS = join(HOME, 'res', 'strings')


program
  .command('export [dir]')
  .description('export the menu strings')
  .action(dir => {
    let home = dir || HOME
    save({ en: extract(open('app').en) }, 'app-menu', 'en', home)
    save({ en: extract(open('context').en) }, 'context-menu', 'en', home)
  })

program
  .command('import [dir]')
  .description('import all matching YML files')
  .action(dir => {
    console.log('ho')
    let home = dir || HOME

    for (let file of ls(home)) {
      let m = file.match(
        /^for_(use|translation)_tropy_(\w+)-menu_(\w{2}(-\w{2})?).yml$/)

      if (m != null) {
        let name = m[2]
        let locale = m[3]

        say(`importing ${locale} labels into ${name} menu...`)
        let labels = load(join(home, file))[locale]
        let menu = yaml.load(yaml.dump(open(name).en, { noRefs: true }))
        translate(menu, labels)
        save({ [locale]: menu }, name, locale)
        rm(join(home, file))

      } else {
        m = file.match(
          /^for_use_tropy_(renderer|browser)_(\w{2}(-\w{2})?).yml$/)

        if (m != null) {
          let type = m[1]
          let locale = m[2]
          say(`importing ${locale} ${type} strings...`)

          let { en } = load(join(STRINGS, `${type}.en.yml`))
          let data = load(join(home, file))[locale]

          save({ [locale]: merge(en, data) }, type,  locale, STRINGS)
          rm(join(home, file))
        }
      }
    }
  })

program
  .command('fetch [dir]')
  .option('-t, --token <token>',
    'set the Transifex API token',
    process.env.TRANSIFEX_API_TOKEN)
  .option('-l, --lang <codes...>',
    'set the languages to fetch',
    ['de', 'fr', 'es', 'pt', 'pt_BR', 'ja', 'it', 'uk', 'zh_CN'])
  .option('-r, --res <slugs...>',
    'set the resources to fetch',
    ['app-menu', 'context-menu', 'browser', 'renderer'])
  .action(async (dir, opts) => {
    let home = dir || HOME

    if (!opts.token) {
      bail('missing Transifex API token')
    }

    let { transifexApi: tx } = loadTransifexApi()
    tx.setup({ auth: opts.token })

    let cds = await tx.Organization.get({ slug: 'cds' })
    let projects = await cds.fetch('projects')
    let project = await projects.get({ slug: 'tropy' })

    for (let code of opts.lang) {
      let language = await tx.Language.get({ code })

      for (let slug of opts.res) {
        let resource = await tx.Resource.get({ project, slug })
        let url = await tx.ResourceTranslationsAsyncDownload.download({
          resource,
          language
        })

        let res = await fetch(url)

        if (res.status !== 200) {
          warn(`failed to fetch ${slug} ${code}: ${res.statusText}`)
          continue
        }

        let tag = code
          .replace('zh_CN', 'cn')
          .replace('_', '-')

        let data = (await res.text()).replace(code, tag)
        write(join(home, `for_use_tropy_${slug}_${tag}.yml`), data)

        say(`fetched ${code} ${slug}`)
      }
    }
  })



const loadTransifexApi = () => {
  try {
    return require('@transifex/api')
  } catch {
    bail('missing @transifex/api')
  }
}

const load = (file) =>
  yaml.load(read(file))

const open = (file, locale = 'en') =>
  load(join(MENU, `${file}.${locale}.yml`))

const save = (data, file, locale, dst = MENU) =>
  write(join(dst, `${file}.${locale}.yml`), yaml.dump(data, {
    noRefs: true
  }))

const flatten = (menu, prefix = '', into = {}) =>
  menu.reduce((acc, item, idx) => {
    if (item.label != null) {
      acc[`${prefix}.${idx}.label`] = item.label
    }

    if (item.submenu != null) {
      flatten(item.submenu, `${prefix}.${idx}.submenu`, acc)
    }

    return acc
  }, into)

const extract = (menu, prefix = null, into = {}) => {
  for (const prop in menu) {
    if (Array.isArray(menu[prop])) {
      flatten(menu[prop], prefix ? `${prefix}.${prop}` : prop, into)
    } else {
      extract(menu[prop], prefix ? `${prefix}.${prop}` : prop, into)
    }
  }

  return into
}

const set = (src, path, value) => {
  let parts = path.split('.')
  let obj = src
  let i = 0
  while (i < parts.length - 1) obj = obj[parts[i++]]
  obj[parts[i]] = value
}

const translate = (menu, labels) => {
  for (const path in labels) {
    set(menu, path, labels[path])
  }
}

const merge = (a, b, into = {}) => {
  if (a !== into) Object.assign(into, a)

  for (let prop in b) {
    let value = b[prop]
    let type = typeof value

    switch (true) {
      case type === 'boolean':
      case type === 'number':
      case type === 'string':
      case type === 'undefined':
      case value == null:
        into[prop] = value
        break
      case Array.isArray(value):
        into[prop] = [...value]
        break
      default:
        into[prop] = merge(into[prop], value)
        break
    }
  }

  return into
}

if (require.main === module) {
  program.parseAsync(process.argv)
}
