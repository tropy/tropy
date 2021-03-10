'use strict'

const { join, resolve } = require('path')
const { unlink, readdir } = require('fs').promises
const { app, net, session } = require('electron')
const { check, error, say } = require('./util')('δ')
const { argv } = require('yargs')
const unzip = require('unzip-crx-3')

const {
  existsSync: exists,
  mkdirSync: mkdir,
  readFileSync: read,
  createWriteStream
} = require('fs')

const REACT_DEVTOOLS = 'fmkadmapgofadopljbjfkapdkoienihi'
const REDUX_DEVTOOLS = 'lmhkpmbekcpmknklioeibfkpmmfibljd'

let data

if (argv.data) {
  check(exists(argv.data),
    `user data directory not found: ${argv.data}`)

  data = argv.data
  app.setPath('userData', resolve(data, 'electron'))
} else {
  data = app.getPath('userData')
}

app.once('ready', async () => {
  try {
    switch (argv._[0]) {
      case 'download':
        await download(REACT_DEVTOOLS)
        await download(REDUX_DEVTOOLS)
        break
      case undefined:
      case 'i':
      case 'install':
        // install({ name: 'devtron', path: require('devtron').path })
        await install(await download(REACT_DEVTOOLS))
        await install(await download(REDUX_DEVTOOLS))

        session
          .defaultSession
          .getAllExtensions()
          .forEach(e => say(`${e.name} ${e.version}`))

        break
      default:
        throw new Error(`unknown command: "${argv[0]}"`)
    }
  } catch (e) {
    error(e.message)
    console.log(e.stack)
  }

  app.exit(0)
})

const download = async (id) => {
  let root = resolve(data, 'extensions')
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

const install = ({ name, path }) => {
  say(`installing ${name}...`)
  return session.defaultSession.loadExtension(path, { allowFileAccess: true })
}
