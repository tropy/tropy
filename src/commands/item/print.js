'use strict'

const { ipcRenderer: ipc } = require('electron')
const { select } = require('redux-saga/effects')
const { Command } = require('../command')
const { ITEM } = require('../../constants')
const { getPrintableItems } = require('../../selectors')


class Print extends Command {
  *exec() {
    let [prefs, project, items] = yield select(state => ([
      state.settings.print,
      state.project.id,
      getPrintableItems(state)
    ]))

    if (items.length) {
      ipc.send('print', { ...prefs, project, items })
    }
  }
}

Print.register(ITEM.PRINT)

module.exports = {
  Print
}
