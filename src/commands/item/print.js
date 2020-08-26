import { ipcRenderer as ipc } from 'electron'
import { select } from 'redux-saga/effects'
import { Command } from '../command'
import { ITEM } from '../../constants'
import { getPrintableItems } from '../../selectors'


export class Print extends Command {
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
