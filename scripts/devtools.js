import { join, resolve } from 'node:path'
import { unlink } from 'node:fs/promises'
import { app, net, session } from 'electron'
import { program } from 'commander'
import unzip from 'unzip-crx-3'
import { check, error, say, setLogSymbol } from './util.js'

import {
  existsSync as exists,
  mkdirSync as mkdir,
  readFileSync as read,
  createWriteStream
} from 'node:fs'

setLogSymbol('δ')

const REACT_DEVTOOLS = 'fmkadmapgofadopljbjfkapdkoienihi'
const REDUX_DEVTOOLS = 'lmhkpmbekcpmknklioeibfkpmmfibljd'

program
  .name('tropy-devtools')
  .option('-D, --data <string>', 'path to user data', 'tmp')

setUserData()

program
  .command('download')
  .action(async (opts) => {
    await download(REACT_DEVTOOLS)
    await download(REDUX_DEVTOOLS)
  })

program
  .command('install')
  .action(async (opts) => {
    await install(await download(REACT_DEVTOOLS))
    await install(await download(REDUX_DEVTOOLS))
    list()
  })

program
  .command('list')
  .action(async (opts) => {
    list()
  })

app
  .whenReady()
  .then(() => program.parseAsync())
  .then(() => app.exit(0))


function setUserData() {
  program.parse()
  let { data } = program.opts()
  check(exists(data),
    `user data directory not found: ${data}`)

  app.setPath('userData', resolve(data, 'electron'))
}

function list() {
  session
    .defaultSession
    .getAllExtensions()
    .forEach(e => say(`${e.name} ${e.version}`))
}

async function download(id) {
  let root = resolve(app.getPath('userData'), 'extensions')
  let path = join(root, id)
  let url = CRX(id)
  let crx = `${path}.crx`

  if (!exists(path)) {
    if (!exists(root)) mkdir(root)

    say(`fetching ${id}.crx...`)
    say(url)
    await save(url, crx)
    await unzip(crx, path)
    await unlink(crx)
  }

  let { name, version } = JSON.parse(
    read(join(path, 'manifest.json'), 'utf-8'))

  return { name, version, path }
}

const CRX = (id) =>
  `https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3&prodversion=${process.versions.chrome}&x=id%3D${id}%26uc`

const save = (url, to) =>
  new Promise((resolve, reject) => {
    net.request(url)
      .on('response', (res) => {
        res.pipe(createWriteStream(to)).on('close', resolve)
      })
      .on('error', reject)
      .end()
  })

function install({ name, path }) {
  say(`installing ${name}...`)
  return session.defaultSession.loadExtension(path, { allowFileAccess: true })
}
