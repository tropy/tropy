'use strict'

/* eslint no-console: "off" */

const {
  default: dti,

  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS

} = require('electron-devtools-installer')


function install(ext) {
  return dti(ext)
    .then(name => console.log(`Added Extension "${name}"`))
    .catch(error => console.log('An Error occurred: ', error))
}

module.exports = {
  install,

  react() {
    install(REACT_DEVELOPER_TOOLS)
  },

  redux() {
    return install(REDUX_DEVTOOLS)
  },

  devtron() {
    require('devtron').install()
  }
}
