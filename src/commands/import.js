import { basename, extname } from 'path'
import { call, put, select } from 'redux-saga/effects'
import { DuplicateError } from '../common/error'
import { Command } from './command'
import * as mod from '../models'
import * as act from '../actions'
import * as dir from '../common/dir'
import { pick } from '../common/util'
import { open, prompt } from '../dialog'
import { Image } from '../image'
import { IMAGE } from '../constants'
import { dc, dcterms } from '../ontology/ns'
import { date, text } from '../value'
import { getTemplateValues, getTemplateProperties } from '../selectors'


export class ImportCommand extends Command {
  static *consolidate(cache, image, photos, { overwrite = true } = {}) {
    while (!image.done) {
      let photo = photos[image.page]

      yield call(cache.consolidate, photo, image, {
        overwrite
      })

      yield put(act.photo.update({
        id: photo,
        broken: false,
        consolidated: Date.now(),
        consolidating: false
      }))

      image.next()
    }
  }

  async promptForFilesToImport(type) {
    try {
      this.suspend()
      switch (type) {
        case 'dir':
          return open.dir()
        case 'items':
          return open.items()
        default:
          return open.images()
      }
    } finally {
      this.resume()
    }
  }

  canImportFile = (file) => (
    IMAGE.EXT.includes(extname(file.name).slice(1).toLowerCase())
  )

  getFilesToImport = async () => {
    let { payload, meta } = this.action
    let { files = [], urls = [] } = payload

    if (!files.length && !urls.length && meta.prompt)
      files = await this.promptForFilesToImport(meta.prompt)

    let json = files.filter(f => (/^\.json(ld)?$/i).test(extname(f)))

    let images = await dir.expand(files, {
      filter: this.canImportFile,
      recursive: true
    })

    return [...json, ...images, ...urls]
  }

  *openImage(path) {
    let settings = yield select(state => state.settings)

    return yield call(Image.open, {
      path,
      density: settings.density,
      useLocalTimezone: settings.localtime
    })
  }

  *getMetadata(image, templates) {
    let data = {}
    let prefs = yield select(state => state.settings)

    for (let type in templates) {
      data[type] = this.getImageMetadata(type, image, templates[type], prefs)
    }

    return data
  }

  getImageMetadata(type, image, template, prefs) {
    let props = getTemplateProperties(template)
    let data = {
      ...getTemplateValues(template),
      ...pick(image.data, props)
    }

    let title = prefs.title[type]

    if (title != null) {
      if (prefs.title.force || !(title in data)) {
        data[title] = text(image.title)
      }
    }

    if (type === 'photo') {
      if (!(dc.date in data || dcterms.date in data)) {
        data[dc.date] = date(image.date)
      }
    }

    return data
  }

  *isDuplicate(image) {
    return null != (yield call(mod.photo.find, this.options.db, {
      checksum: image.checksum
    }))
  }

  *getDuplicateHandler() {
    if (this.duplicateHandler == null) {
      this.duplicateHandler = yield select(({ settings }) => settings.dup)
    }

    return this.duplicateHandler
  }

  *setDuplicateHandler(handler) {
    this.duplicateHandler = handler
    yield put(act.settings.persist({ dup: handler }))
  }

  *handleDuplicate(image) {
    const handler = yield* this.getDuplicateHandler()
    if (handler === 'import') return

    if (yield* this.isDuplicate(image)) {
      switch (handler) {
        case 'prompt': {
          this.isInteractive = true
          const { ok, isChecked } = yield call(prompt, 'dup', {
            message: basename(image.path)
          })

          if (isChecked) {
            yield* this.setDuplicateHandler(ok ? 'import' : 'skip')
          }

          if (ok) break
        }
        // eslint-disable-next-line no-fallthrough
        case 'skip':
          throw new DuplicateError(image.path)
      }
    }
  }
}
