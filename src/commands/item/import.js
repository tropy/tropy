import fs from 'fs'
import { dirname, extname, join, isAbsolute } from 'path'
import { ImportCommand } from '../import'
import { DuplicateError } from '../../common/error'
import { normalize, eachItem } from '../../common/import'
import { info, warn } from '../../common/log'
import { Image } from '../../image'
import { fail } from '../../dialog'
import { fromHTML } from '../../editor/serialize'
import * as act from '../../actions'
import * as mod from '../../models'
import { ITEM, NAV } from '../../constants'
import win from '../../window'

import {
  all,
  call,
  fork,
  join as wait,
  put,
  select
} from 'redux-saga/effects'

import {
  findTag,
  getItemTemplate,
  getPhotoTemplate,
  getSelectionTemplate
} from '../../selectors'

const { readFile } = fs.promises

export class Import extends ImportCommand {
  *exec() {
    let { payload, meta } = this.action

    // Subtle: push items to this.result early to support
    // undo after cancelled (partial) import!
    this.result = []
    this.backlog = []

    yield* this.configure()

    yield this.progress({ progress: 0 })
    yield put(act.nav.update({ mode: NAV.MODE.PROJECT, query: '' }))

    if (meta.plugin) {
      yield call(win.plugins.exec, {
        id: meta.plugin,
        action: 'import'
      }, payload, meta)
    }

    if (payload.data) {
      yield* this.importFromJSON(payload.data)

    } else {
      let files = yield call(this.getFilesToImport)

      if (files.length === 0)
        return this.result

      yield this.progress({ total: files.length })

      let maxFail = 15
      let failures = 0

      for (let file of files) {
        try {
          if ((/json(ld)?$/i).test(extname(file))) {
            let text = yield call(readFile, file, 'utf-8')
            yield* this.importFromJSON(JSON.parse(text), dirname(file))

          } else
            yield* this.importFromImage(file)

        } catch (e) {
          warn({ stack: e.stack }, `failed to import "${file}"`)

          if (++failures < maxFail) {
            fail(e, this.action.type)
          }
        }
      }
    }

    if (this.backlog.length > 0) {
      yield wait(this.backlog)
    }

    return this.result
  }

  *configure() {
    Object.assign(this.options, yield select(state => ({
      basePath: state.project.basePath,
      density: this.action.meta.density || state.settings.density,
      templates: {
        item: getItemTemplate(state),
        photo: getPhotoTemplate(state),
        selection: getSelectionTemplate(state)
      },
      useLocalTimezone: state.settings.timezone
    })))
  }


  *importFromImage(path) {
    try {
      yield this.progress()

      let {
        basePath, store, density, db, templates, useLocalTimezone
      } = this.options

      let { list } = this.action.payload
      let item
      let photos = []

      let image = yield call([Image, Image.open], {
        path,
        density,
        useLocalTimezone
      })

      yield* this.handleDuplicate(image)
      let data = yield* this.getMetadata(image, templates)
      yield call(store.add, image)

      yield call(db.transaction, async tx => {
        item = await mod.item.create(tx, templates.item.id, data.item)

        while (!image.done) {
          let photo = await mod.photo.create(tx,
            { basePath, template: templates.photo.id },
            {
              item: item.id,
              image: image.toJSON(),
              data: data.photo
            })

          if (list) {
            await mod.list.items.add(tx, list, [item.id])
            item.lists.push(list)
          }

          item.photos.push(photo.id)

          photos.push({
            ...photo,
            consolidating: true
          })

          image.next()
        }
      })

      this.result.push(item.id)

      yield all([
        put(act.item.insert(item)),
        put(act.metadata.load([item.id, ...item.photos])),
        put(act.photo.insert(photos))
      ])

      image.rewind()

      this.backlog.push(
        yield fork(ImportCommand.consolidate,
          this.options.cache,
          image,
          item.photos))

    } catch (e) {
      if (e instanceof DuplicateError)
        info(`skipping duplicate "${path}"...`)
      else
        throw e
    }
  }

  *importFromJSON(data, rel) {
    let graph = yield call(normalize, data)

    if (graph.length > 1)
      yield this.progress({ total: graph.length - 1 })

    for (let item of eachItem(graph)) {
      yield* this.importJSONItem(item, rel)
    }
  }

  *importJSONItem(obj, rel) {
    try {
      let { db, basePath, templates } = this.options
      let { list } = this.action.payload
      let item
      let photos = []
      let selections = []
      let notes = []
      let tags

      yield this.progress()

      if (obj.tags.length) {
        tags = yield* this.findOrCreateTags(obj.tags)
      }

      yield call(db.transaction, async tx => {
        item = await mod.item.create(
          tx,
          obj.template || templates.item.id,
          obj.data)

        if (tags) {
          await mod.item.tags.set(
            tx,
            tags.map(tag => ({ id: item.id, tag })))
          item.tags = [...tags]
        }

        if (list) {
          await mod.list.items.add(tx, list, [item.id])
          item.lists.push(list)
        }

        for (let i = 0; i < obj.photos.length; ++i) {
          let { template, image, data } = obj.photos[i]

          if (!template)
            template = templates.photo.id

          if (rel && image.protocol === 'file' && !isAbsolute(image.path))
            image.path = join(rel, image.path)

          let photo = await mod.photo.create(tx, { basePath, template }, {
            item: item.id,
            image,
            data,
            position: i + 1
          })

          await importNotes(tx, obj.photos[i].notes, photo, notes)

          for (let s of obj.photos[i].selections) {
            let selection = await mod.selection.create(tx, {
              ...s,
              photo: photo.id,
              template: s.template || templates.selection.id
            })

            await importNotes(tx, s.notes, selection, notes)

            photo.selections.push(selection.id)
            selections.push(selection)
          }

          item.photos.push(photo.id)

          photos.push(photo)
        }
      })

      this.result.push(item.id)

      yield all([
        put(act.note.insert(notes)),
        put(act.selection.insert(selections)),
        put(act.photo.insert(photos)),
        put(act.item.insert(item)),
        put(act.metadata.load([
          item.id,
          ...photos.map(p => p.id),
          ...selections.map(s => s.id)
        ]))
      ])

    } catch (e) {
      warn({ stack: e.stack }, 'skipping item due to import error')
    }
  }

  *findOrCreateTags(names) {
    let tagIds = []
    let state = yield select()
    let { db } = this.options

    for (let name of names) {
      let tag = findTag(state, { name })

      // TODO remove and re-create tags on undo/redo.
      // Currently the tags remain after an undo.

      if (!tag) {
        tag = yield call(mod.tag.create, db, { name })
        yield put(act.tag.insert(tag))
      }

      tagIds.push(tag.id)
    }

    return tagIds
  }

  get redo() {
    return (this.result && this.result.length > 0) ?
      act.item.restore(this.result) :
      null
  }

  get undo() {
    return (this.result && this.result.length > 0) ?
      act.item.delete(this.result) :
      null
  }
}

Import.register(ITEM.IMPORT)


const importNotes = async (db, notes, parent, result = []) => {
  for (let { html, language } of notes) {
    let { state, text } = fromHTML(html)
    let note = await mod.note.create(db, {
      id: parent.id,
      state,
      text,
      language
    })

    parent.notes.push(note.id)
    result.push(note)
  }
  return result
}
