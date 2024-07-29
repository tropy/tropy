import { call, put, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { SELECTION } from '../../constants/index.js'
import { Image } from '../../image/image.js'
import mod from '../../models/selection.js'
import * as act from '../../actions/index.js'
import { getSelectionTemplate, getTemplateValues } from '../../selectors/index.js'


export class Create extends Command {
  *exec() {
    let { cache, db } = this.options
    let { payload, meta } = this.action

    let [photo, template] = yield select(state => ([
      state.photos[payload.photo],
      getSelectionTemplate(state)
    ]))

    let image = yield call([Image, Image.open], {
      path: cache.url('full', photo)
    })

    let idx = (meta.idx != null) ?
      meta.idx :
        [photo.selections.length]

    let data = getTemplateValues(template)

    let selection = yield call(db.transaction, tx =>
      mod.create(tx, {
        data,
        template: template.id,
        ...payload
      }))

    yield call(cache.consolidate, selection.id, image, {
      selection
    })

    let selections = [selection.id]
    let position = { idx }

    yield put(act.photo.selections.add({
      id: photo.id,
      selections
    }, position))

    this.undo = act.selection.delete({
      photo: photo.id,
      selections
    }, position)

    this.redo = act.selection.restore({
      photo: photo.id,
      selections
    }, position)

    return selection
  }
}

Create.register(SELECTION.CREATE)
