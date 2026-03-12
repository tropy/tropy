import { writeFile as write } from 'node:fs'
import { call, cps, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { TAG } from '../../constants/index.js'
import { copy } from '../../clipboard.js'
import { join } from '../../common/csv.js'
import { save } from '../../dialog.js'
import { getAllTags } from '../../selectors/index.js'


export class Export extends Command {
  *exec() {
    let { target } = this.action.meta

    if (!target) {
      this.isInteractive = true
      target = yield call(save.csv, { defaultPath: 'tags.csv' })
    }

    if (!target) return

    let tags = yield select(getAllTags)
    let text = join(tags.map(t => t.name))

    switch (target) {
      case ':clipboard:':
        copy({ text })
        break
      default:
        yield cps(write, target, text)
    }
  }
}

Export.register(TAG.EXPORT)
