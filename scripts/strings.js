'use strict'

require('shelljs/make')

const { say } = require('./util')('make')
const { join } = require('path')
const { readFileSync: read, writeFileSync: write } = require('fs')
const { isArray } = Array
const yaml = require('js-yaml')

const HOME = join(__dirname, '..')
const MENU = join(HOME, 'res', 'menu')
const STRINGS = join(HOME, 'res', 'strings')

const load = (file) =>
  yaml.safeLoad(read(file))

const open = (file, locale = 'en') =>
  load(join(MENU, `${file}.${locale}.yml`))

const save = (data, file, locale, dst = MENU) =>
  write(join(dst, `${file}.${locale}.yml`), yaml.safeDump(data, {
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
    if (isArray(menu[prop])) {
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


target.export = () => {
  save({ en: extract(open('app').en) }, 'app-menu', 'en', HOME)
  save({ en: extract(open('context').en) }, 'context-menu', 'en', HOME)
}

target.import = (args = []) => {
  let home = args[0] || HOME

  for (const file of ls(home)) {
    let m = file.match(
      /^for_(use|translation)_tropy_(\w+)-menu_(\w{2}).yml$/)

    if (m != null) {
      let name = m[2]
      let locale = m[3]

      say(`importing ${locale} labels into ${name} menu...`)
      let labels = load(join(home, file))[locale]
      let menu = yaml.safeLoad(yaml.safeDump(open(name).en, { noRefs: true }))
      translate(menu, labels)
      save({ [locale]: menu }, name, locale)
      rm(join(home, file))

    } else {
      m = file.match(/^for_use_tropy_(renderer|browser)_(\w{2}).yml$/)
      if (m == null) continue

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
