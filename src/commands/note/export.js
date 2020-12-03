import fs from 'fs'
import { extname } from 'path'
import { call, select } from 'redux-saga/effects'
import { clipboard } from 'electron'
import { serialize, toHTML, toMarkdown } from '../../editor/serialize'
import { Command } from '../command'
import { fail, save } from '../../dialog'
import { warn } from '../../common/log'
import { pluck } from '../../common/util'
import { getVisibleNotes } from '../../selectors'
import { NOTE } from '../../constants'


export class Export extends Command {
  *exec() {
    try {
      let id = this.action.payload
      var { target, format } = this.action.meta

      if (!target)
        target = yield call(save.notes)
      if (!target)
        return

      let [settings, notes] = yield select(state => ([
        state.settings,
        id ? pluck(state.notes, id) : getVisibleNotes(state)
      ]))

      if (!format)
        format = formatFor(target, settings.export.note)

      let data = mapNotes(notes, format, settings.export.note)

      switch (target) {
        case ':clipboard:':
          if (format === 'html')
            clipboard.write({ html: data, text: data })
          else
            clipboard.write({
              html: mapNotes(notes, 'html', format, settings.export.note),
              text: data
            })
          break
        default:
          yield call(fs.promises.writeFile, target, data)
      }


    } catch (e) {
      warn({
        stack: e.stack
      }, `failed to export notes as ${format} to ${target}`)
      fail(e, this.action.type)
    }
  }

}

Export.register(NOTE.EXPORT)

function mapNotes(notes, format, opts) {
  switch (format) {
    case 'json':
      return JSON.stringify(
        notes.map(n => ({ '@type': 'Note', ...serialize(n, opts) })
      ), null, 2)

    case 'html':
      return notes.map(n => toHTML(n.state.doc)).join('\n')

    case 'markdown':
      return notes.map(n => toMarkdown(n.state.doc)).join('\n\n')

    default:
      return notes.map(n => n.text).join('\n\n')
  }
}

function formatFor(target, opts) {
  if (target === ':clipboard:')
    return opts.copy

  switch (extname(target)) {
    case '.json':
    case '.jsonld':
      return 'json'
    case '.md':
    case '.markdown':
      return 'markdown'
    case '.txt':
      return 'text'
    default:
      return 'html'
  }
}
