'use strict'

require('shelljs/make')

const { rules, say, warn } = require('./util')('make')
const { join } = require('path')
const { readFileSync: read, writeFileSync: write } = require('fs')
const { isArray } = Array
const yaml = require('js-yaml')

const HOME = join(__dirname, '..')
const MENU = join(HOME, 'res', 'menu')

const load = (file) =>
  yaml.safeLoad(read(file))

const open = (file, locale = 'en') =>
  load(join(MENU, `${file}.${locale}.yml`))

const save = (menu, file, locale, dst = MENU) =>
  write(join(dst, `${file}.${locale}.yml`), yaml.safeDump(menu, {
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


target.export = () => {
  save({ en: extract(open('app').en) }, 'app-menu', 'en', HOME)
  save({ en: extract(open('context').en) }, 'context-menu', 'en', HOME)
}

target.import = (args = []) => {
  const home = args[0] || HOME

  for (const file of ls(home)) {
    const m = file.match(
      /^for_(use|translation)_tropy_(\w+)-menuyml_(\w{2}).yml$/)

    if (m == null) continue

    const name = m[2]
    const locale = m[3]

    say(`importing ${locale} labels into ${name} menu...`)
    const labels = load(join(home, file))[locale]
    const menu = open(name).en
    translate(menu, labels)
    save({ [locale]: menu }, name, locale)
  }
}

target.rules = () =>
  rules(target)
