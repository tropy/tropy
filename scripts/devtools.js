'use strict'

const { join, resolve } = require('path')
const  rm = require('rimraf')
const { app, net, BrowserWindow } = require('electron')
const { check, error, say, warn } = require('./util')('δ')
const { argv } = require('yargs')

const unzip = async (...args) => {
  try {
    return require('unzip-crx')(...args)
  } catch (e) {
    warn('missing `unzip-crx`: npm i unzip-crx --no-save')
    throw e
  }
}

const {
  existsSync: exists,
  mkdirSync: mkdir,
  readFileSync: read,
  createWriteStream
} = require('fs')

const REACT_DEVTOOLS = 'fmkadmapgofadopljbjfkapdkoienihi'
const REDUX_DEVTOOLS = 'lmhkpmbekcpmknklioeibfkpmmfibljd'

if (argv.userData) {
  check(exists(argv.userData),
    `user data directory not found: ${argv.userData}`)
  // say(`using ${argv.userData}`)
  app.setPath('userData', resolve(argv.userData))
}

app.once('ready', async () => {
  try {
    switch (argv._[0]) {
      case undefined:
      case 'ls':
      case 'list':
        for (let { name, version } of getExtensions()) {
          say(`${name} ${version}`)
        }
        break
      case 'rm':
      case 'remove':
        if (argv._[1]) {
          say(`removing ${argv._[1]}...`)
          BrowserWindow.removeDevToolsExtension(argv._[1])
        } else {
          for (let { name, version } of getExtensions()) {
            say(`removing ${name} ${version}...`)
            BrowserWindow.removeDevToolsExtension(name)
          }
        }
        break
      case 'download':
        await download(REACT_DEVTOOLS)
        await download(REDUX_DEVTOOLS)
        break
      case 'i':
      case 'install':
        install({ name: 'devtron', path: require('devtron').path })
        install(await download(REACT_DEVTOOLS))
        install(await download(REDUX_DEVTOOLS))
        break
      default:
        throw new Error(`unknown command: "${argv[0]}"`)
    }
  } catch (e) {
    error(e.message)
  }

  app.quit()
})

const download = async (id) => {
  let root = join(app.getPath('userData'), 'extensions')
  let path = join(root, id)
  let url = CRX(id)
  let crx = `${path}.crx`

  if (!exists(path)) {
    if (!exists(root)) mkdir(root)

    say(`fetching ${id}.crx...`)
    await save(url, crx)
    await unzip(crx, path)
    rm.sync(crx)
  }

  let { name, version } = JSON.parse(
    read(join(path, 'manifest.json'), 'utf-8'))

  return { name, version, path }
}

const CRX = (id) =>
  `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=${process.versions.chrome}&x=id%3D${id}%26uc`

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
  if (isInstalled(name)) {
    say(`skipping ${name}...`)
    return false
  }

  say(`installing ${name}...`)
  BrowserWindow.addDevToolsExtension(path)
  return true
}

const isInstalled = name =>
  (name in BrowserWindow.getDevToolsExtensions())

const getExtensions = () =>
  Object.values(BrowserWindow.getDevToolsExtensions())
