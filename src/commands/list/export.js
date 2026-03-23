import { writeFile as write } from 'node:fs'
import { call, cps, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { LIST } from '../../constants/index.js'
import { copy } from '../../clipboard.js'
import { join } from '../../common/csv.js'
import { save } from '../../dialog.js'
import { getLists } from '../../selectors/index.js'


export class Export extends Command {
  *exec() {
    let { meta, payload } = this.action
    let { target } = meta

    if (!target) {
      if (!meta.prompt) {
        return yield select(getLists, payload)
      }

      this.isInteractive = true
      target = yield call(save.csv, { defaultPath: 'lists.csv' })
      if (!target) return
    }

    let lists = yield select(getLists, payload)
    let text = join(lists, '\n')

    switch (target) {
      case ':clipboard:':
        copy({ text })
        break
      default:
        yield cps(write, target, text)
    }
  }
}

Export.register(LIST.EXPORT)
