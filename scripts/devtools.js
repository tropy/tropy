'use strict'

const { resolve } = require('path')
const { app } = require('electron')

if (process.argv.length > 2) {
  app.setPath('userData', resolve(process.argv.pop()))
}

app.on('ready', async () => {
  try {
    console.log(`Using user data directory: ${app.getPath('userData')}`)

    let {
      default: install,
      REACT_DEVELOPER_TOOLS,
      REDUX_DEVTOOLS
    } = require('electron-devtools-installer')

    await install(REACT_DEVELOPER_TOOLS)
    console.log('Installed React Developer Tools')

    await install(REDUX_DEVTOOLS)
    console.log('Installed Redux Developer Tools')

    require('devtron').install()
    console.log('Installed Devtron Extension')

    app.exit()

  } catch (error) {
    console.log('An error occurred: ', error)
    app.exit(1)
  }
})
