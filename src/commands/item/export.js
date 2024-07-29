import fs from 'fs'
import { clipboard } from 'electron'
import { call, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { ITEM } from '../../constants/index.js'
import { warn } from '../../common/log.js'
import { fail, save } from '../../dialog.js'
import win from '../../window.js'
import { getExportItems } from '../../selectors/index.js'

const write = fs.promises.writeFile


export class Export extends Command {
  *exec() {
    let { target, plugin } = this.action.meta
    let id = this.action.payload

    if (plugin) target = ':plugin:'

    try {
      if (!target) {
        this.suspend()
        target = yield call(save.items, {})
        this.resume()
      }

      if (!target) return

      let items = yield select(state => getExportItems(state, { id }))

      switch (target) {
        case ':clipboard:':
          clipboard.writeText(JSON.stringify(items, null, 2))
          break
        case ':plugin:':
          yield call(win.plugins.export, plugin, items)
          break
        default:
          yield call(write, target, JSON.stringify(items, null, 2))
      }
    } catch (e) {
      warn({ stack: e.stack }, `failed to export items to ${target}`)
      fail(e, this.action.type)
    }
  }
}

Export.register(ITEM.EXPORT)
