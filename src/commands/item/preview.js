import { select } from 'redux-saga/effects'
import { Command } from '../command'
import { ITEM } from '../../constants'
import { win } from '../../window'
import { darwin } from '../../common/os'
import { get } from '../../common/util'


export class Preview extends Command {
  *exec() {
    if (!darwin) return

    let { photos } = this.action.payload
    let paths = yield select(state =>
      photos.map(id => get(state.photos, [id, 'path'])))

    if (paths.length > 0) {
      win.preview(paths[0])
    }
  }
}

Preview.register(ITEM.PREVIEW)
