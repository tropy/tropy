import { basename, extname } from 'node:path'
import { call, put, select } from 'redux-saga/effects'
import { DuplicateError } from '../common/error.js'
import { Command } from './command.js'
import * as mod from '../models/index.js'
import * as act from '../actions/index.js'
import { expand } from '../common/fs.js'
import { pick } from '../common/util.js'
import { open, prompt } from '../dialog.js'
import { Image } from '../image/image.js'
import { IMAGE } from '../constants/index.js'
import { dc, dcterms } from '../ontology/ns.js'
import { date, text } from '../value.js'
import { getTemplateValues, getTemplateProperties } from '../selectors/index.js'


export class ImportCommand extends Command {
  static *consolidate(args = {}) {
    let { cache, image, photos, overwrite = true } = args

    // Subtle: when importing, *consolidation is forked
    // in order not to block importing the next item.
    // The backlog of consolidation process is retained
    // so that the import command can wait for it to finish.
    // Because of this, the arguments passed to consolidate
    // can't be garbage collected.
    // We clear the image reference here so that
    // the allocated memory can be freed after consolidation,
    // not at the end of the import command.
    args.image = null

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

    let images = await expand(files, {
      filter: this.canImportFile,
      recursive: true
    })

    return [...json, ...images, ...urls]
  };

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
        data[title] = text(image.name)
      }
    }

    if (type === 'photo') {
      if (!(dc.date in data || dcterms.date in data)) {
        data[dc.date] = date(image.date)
      }

      if (image.description && image.description.length < 256) {
        if (!(dc.description in data || dcterms.description in data)) {
          data[dc.description] = text(image.description)
        }
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
      this.duplicateHandler =
        this.action.meta.duplicate ||
        (yield select(({ settings }) => settings.dup))
    }

    return this.duplicateHandler
  }

  *setDuplicateHandler(handler) {
    this.duplicateHandler = handler
    yield put(act.settings.persist({ dup: handler }))
  }

  *handleDuplicate(image) {
    const handler = yield * this.getDuplicateHandler()
    if (handler === 'import') return

    if (yield * this.isDuplicate(image)) {
      switch (handler) {
        case 'prompt': {
          this.isInteractive = true
          const { ok, isChecked } = yield call(prompt, 'dup', {
            message: basename(image.path)
          })

          if (isChecked) {
            yield * this.setDuplicateHandler(ok ? 'import' : 'skip')
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
