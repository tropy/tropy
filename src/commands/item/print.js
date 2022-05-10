import { ipcRenderer as ipc } from 'electron'
import { select } from 'redux-saga/effects'
import { Command } from '../command'
import { ITEM } from '../../constants'
import { getPrintableItems } from '../../selectors'


export class Print extends Command {
  *exec() {
    let { pdf, landscape } = this.action.meta

    let [prefs, project, items] = yield select(state => ([
      state.settings.print,
      state.project.id,
      getPrintableItems(state)
    ]))

    if (items.length) {
      ipc.send('print', {
        pdf,
        landscape,
        ...prefs,
        project,
        items
      })
    }
  }
}

Print.register(ITEM.PRINT)
