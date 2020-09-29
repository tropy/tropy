import { call, put, select } from 'redux-saga/effects'
import { Command } from '../command'
import { SELECTION } from '../../constants'
import mod from '../../models/selection'
import * as act from '../../actions'
import { getSelectionTemplate, getTemplateValues } from '../../selectors'


export class Create extends Command {
  *exec() {
    let { cache, db } = this.options
    let { payload, meta } = this.action

    let [photo, template, density] = yield select(state => ([
      state.photos[payload.photo],
      getSelectionTemplate(state),
      state.settings.density
    ]))

    let image = yield call(Image.open, {
      ...photo,
      density: photo.density || density
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
