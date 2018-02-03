'use strict'

const fs = require('fs')
const { app } = require('electron')
const { resolve, join } = require('path')
const { sync: mkdir } = require('mkdirp')

const copyFile = (src, dest) => {
  fs.createReadStream(src).pipe(fs.createWriteStream(dest))
}

const copyDir = (src, dest) => {
  mkdir(dest)
  let files = fs.readdirSync(src)
  for (let i = 0; i < files.length; i++) {
    let current = fs.lstatSync(join(src, files[i]))
    if (current.isDirectory()) {
      copyDir(join(src, files[i]), join(dest, files[i]))
    } else if (current.isSymbolicLink()) {
      let symlink = fs.readlinkSync(join(src, files[i]))
      fs.symlinkSync(symlink, join(dest, files[i]))
    } else {
      copyFile(join(src, files[i]), join(dest, files[i]))
    }
  }
}

global.P = {
  copyFixtures() {
    if (app) {
      const fixtures = resolve(__dirname, '..', 'fixtures')
      const root = app.getPath('userData')
      copyDir(resolve(fixtures, 'plugins'), resolve(root, 'plugins'))
      console.log('copyFixtures')
    }
  }
}
