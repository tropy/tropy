import { call, put, select } from 'redux-saga/effects'
import { Document } from 'alto-xml'
import { Command } from '../command.js'
import { array } from '../../common/util.js'
import { create } from '../../models/transcription.js'
import * as slice from '../../slices/transcriptions.js'
import { settings } from '../../actions/index.js'
import { show } from '../../dialog.js'
import win from '../../window.js'

export class Create extends Command {
  *exec () {
    let { db } = this.options
    let {
      angle, config, data, mirror, photo, selection, text
    } = this.action.payload
    let { plugin, prompt = true } = this.action.meta

    // TODO prompt only on request (e.g. modifier key)
    if (prompt && data == null && text == null) {
      if (!(yield * this.configure()))
        return
    }

    if (photo == null && selection == null) {
      ({ photo, selection } = yield select(state => state.nav))
    }

    let isValid = yield select(state => (selection != null) ?
      selection in state.selections :
      array(photo).every(id => id in state.photos))

    // Skip unknown parents, e.g. item ids passed as photos.
    if (!isValid)
      return null


    if (config == null) {
      config = { plugin }
    } else {
      // TODO sanitize config if given (e.g. after retry)
      config = {
        plugin: config.plugin || plugin
      }
    }

    if (data != null) {
      text = Document.parse(data).toPlainText()
    }

    let parents = Array.isArray(photo) ?
      photo : [selection || photo]

    let transcriptions = yield call(db.transaction, async tx =>
      Promise.all(parents.map(parent =>
        create(tx, { angle, config, data, mirror, parent, text }))))

    this.undo = slice.remove(
      transcriptions.map(tr => tr.id))

    this.redo = slice.restore(
      transcriptions.map(({ id, parent }) =>
        ({ id, parent, idx: -1 })))

    return transcriptions.reduce((acc, tr) => (acc[tr.id] = tr, acc), {})
  }

  // Shows the transcription config modal, if available.
  // Returns false if the user cancelled.
  *configure () {
    if (!win.dialog.canShowAsModal('transcription-config'))
      return true

    let config = yield select(state => state.settings.ocr)
    let { cancel, data } = yield this.dialog(
      show, 'transcription-config', { config })

    if (cancel)
      return false

    // For now, the adjusted config becomes the new default. To use it
    // for this transcription only, pass it on in the transcription's
    // config instead: Transcribe merges it with the defaults.
    yield put(settings.persist({ ocr: data }))

    return true
  }
}

Create.register(slice.create.type)
