import { writeFile as write } from 'node:fs'
import { clipboard } from 'electron'
import { call, cps, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { LIST } from '../../constants/index.js'
import { join } from '../../common/csv.js'
import { save } from '../../dialog.js'
import { getAllLists } from '../../selectors/index.js'


export class Export extends Command {
  *exec() {
    let { target } = this.action.meta

    if (!target) {
      this.isInteractive = true
      target = yield call(save.csv, { defaultPath: 'lists.csv' })
    }

    if (!target) return

    let lists = yield select(getAllLists)
    let text = join(lists)

    switch (target) {
      case ':clipboard:':
        yield call(clipboard.write, { text })
        break
      default:
        yield cps(write, target, text)
    }
  }
}

Export.register(LIST.EXPORT)
