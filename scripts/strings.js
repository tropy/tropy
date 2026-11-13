#!/usr/bin/env node

import {
  readdirSync as ls,
  readFileSync as read,
  writeFileSync as write,
  unlinkSync as rm
} from 'node:fs'

import { join } from 'node:path'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import * as yaml from 'js-yaml'
import { program } from 'commander'

import { bail, error, say, setLogSymbol, warn } from './util.js'

setLogSymbol('μ')

const HOME = join(import.meta.dirname, '..')
const MENU = join(HOME, 'res', 'menu')
const STRINGS = join(HOME, 'res', 'strings')

const TRANSIFEX = 'https://rest.api.transifex.com'

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
          /^for_use_tropy_(renderer|main)_(\w{2}(-\w{2})?).yml$/)

        if (m != null) {
          let type = m[1]
          let locale = m[2]
          say(`importing ${locale} ${type} strings...`)

          let { en } = load(join(STRINGS, `${type}.en.yml`))
          let data = load(join(home, file))[locale]

          save({ [locale]: merge(en, data) }, type, locale, STRINGS)
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
    ['de', 'fi_FI', 'fr', 'es', 'pt', 'pt_BR', 'ja', 'nl_NL', 'it', 'ru', 'uk', 'zh_CN'])
  .option('-r, --res <slugs...>',
    'set the resources to fetch',
    ['app-menu', 'context-menu', 'main', 'renderer'])
  .action(async (dir, opts) => {
    let home = dir || HOME

    if (!opts.token) {
      bail('missing Transifex API token')
    }

    for (let code of opts.lang) {
      for (let slug of opts.res) {
        try {
          if (slug === 'main') continue

          let url = await download(opts.token, {
            resource: `o:cds:p:tropy:r:${slug}`,
            language: `l:${code}`
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
        } catch (err) {
          error(`failed fetching ${code} ${slug}: ${err.message}`)
        }
      }
    }
  })


// Requests a Transifex API endpoint.
// Returns the parsed JSON:API document or,
// for 303 responses, the redirect URL.
const transifex = async (token, path, { method = 'GET', body } = {}) => {
  let res = await fetch(`${TRANSIFEX}${path}`, {
    method,
    body: body && JSON.stringify(body),
    redirect: 'manual',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/vnd.api+json'
    }
  })

  if (res.status === 303)
    return { redirect: res.headers.get('location') }

  if (!res.ok)
    throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`)

  return res.json()
}

// Starts an async translation download and polls the job
// until Transifex redirects to the file. Returns the file URL.
const download = async (token, { resource, language, interval = 5000 }) => {
  let job = await transifex(token, '/resource_translations_async_downloads', {
    method: 'POST',
    body: {
      data: {
        type: 'resource_translations_async_downloads',
        attributes: {
          content_encoding: 'text',
          file_type: 'default',
          mode: 'default'
        },
        relationships: {
          resource: { data: { type: 'resources', id: resource } },
          language: { data: { type: 'languages', id: language } }
        }
      }
    }
  })

  while (!job.redirect) {
    if (job.data.attributes.status === 'failed')
      throw new Error(JSON.stringify(job.data.attributes.errors))

    await delay(interval)
    job = await transifex(token,
      `/resource_translations_async_downloads/${job.data.id}`)
  }

  return job.redirect
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
  try {
    let parts = path.split('.')
    let obj = src
    let i = 0

    while (i < parts.length - 1)
      obj = obj[parts[i++]]

    obj[parts[i]] = value

  } catch (err) {
    error(`failed to set ${path} ${value}: ${err.message}`)
  }
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

await program.parseAsync(process.argv)
