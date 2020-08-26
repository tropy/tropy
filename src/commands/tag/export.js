import { writeFile as write } from 'fs'
import { clipboard } from 'electron'
import { call, cps, select } from 'redux-saga/effects'
import { Command } from '../command'
import { TAG } from '../../constants'
import { join } from '../../common/csv'
import { save } from '../../dialog'
import { getAllTags } from '../../selectors'


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
        yield call(clipboard.write, { text })
        break
      default:
        yield cps(write, target, text)
    }
  }
}

Export.register(TAG.EXPORT)
