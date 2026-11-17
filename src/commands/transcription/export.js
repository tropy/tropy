import fs from 'node:fs'
import { extname } from 'node:path'
import { call, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { copy } from '../../clipboard.js'
import { save } from '../../dialog.js'
import * as slice from '../../slices/transcriptions.js'

export class Export extends Command {
  *exec () {
    let id = this.action.payload
    let { target, format } = this.action.meta

    let [tr, settings] = yield select(state => ([
      state.transcriptions[id],
      state.settings.export.transcription
    ]))

    if (!target)
      target = yield this.dialog(save.transcription, { alto: !!tr?.data })
    if (!target)
      return

    if (!format)
      format = formatFor(target, settings)

    let data = (format === 'alto' && tr?.data) || tr?.text

    if (!data)
      return

    if (target === ':clipboard:')
      yield call(copy, { text: data })
    else
      yield call(fs.promises.writeFile, target, data)
  }
}

Export.register(slice.export.type)

function formatFor (target, opts) {
  if (target === ':clipboard:')
    return opts.copyFormat
  else
    return (extname(target) === '.xml') ? 'alto' : 'text'
}
