'use strict'

/* eslint no-console: "off" */

const {
  default: dti,

  REACT_DEVELOPER_TOOLS,
  REACT_PERF,
  REDUX_DEVTOOLS

} = require('electron-devtools-installer')

const { all } = require('bluebird')

function install(ext) {
  return dti(ext)
    .then(name => console.log(`Added Extension "${name}"`))
    .catch(error => console.log('An Error occurred: ', error))
}

module.exports = {
  install,

  react() {
    return all([
      install(REACT_DEVELOPER_TOOLS),
      install(REACT_PERF)
    ])
  },

  redux() {
    return install(REDUX_DEVTOOLS)
  },

  devtron() {
    require('devtron').install()
  }
}
