import fs from 'node:fs'
import { dirname, extname, join, isAbsolute } from 'node:path'
import { ImportCommand } from '../import.js'
import { DuplicateError } from '../../common/error.js'
import { normalize, eachItem } from '../../common/import.js'
import { info, warn } from '../../common/log.js'
import { Image } from '../../image/index.js'
import { fail } from '../../dialog.js'
import { fromHTML } from '../../editor/serialize.js'
import * as act from '../../actions/index.js'
import * as mod from '../../models/index.js'
import { ITEM, NAV } from '../../constants/index.js'
import win from '../../window.js'

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
} from '../../selectors/index.js'
import { importPaths as importLists } from '../list/import.js'

const { readFile } = fs.promises

export class Import extends ImportCommand {
  *exec () {
    let { payload, meta } = this.action

    // Subtle: push items to this.result early to support
    // undo after cancelled (partial) import!
    this.result = []
    this.backlog = []
    this.newLists = []

    yield * this.configure()

    yield this.progress({ progress: 0 })
    yield put(act.nav.update({ mode: NAV.MODE.PROJECT, query: '' }))

    if (meta.plugin) {
      yield call(win.plugins.exec, {
        id: meta.plugin,
        action: 'import'
      }, payload, meta)
    }

    if (payload.data) {
      yield * this.importFromJSON(payload.data)

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
            yield * this.importFromJSON(JSON.parse(text), dirname(file))

          } else
            yield * this.importFromImage(file)

        } catch (err) {
          warn({ err }, `failed to import "${file}"`)

          if (++failures < maxFail) {
            fail(err, this.action.type)
          }
        }
      }
    }

    if (this.backlog.length > 0) {
      yield wait(this.backlog)
    }

    return this.result
  }

  *configure () {
    Object.assign(this.options, yield select(state => ({
      basePath: state.project.basePath,
      density: this.action.meta.density || state.settings.density,
      templates: {
        item: getItemTemplate(state),
        photo: getPhotoTemplate(state),
        selection: getSelectionTemplate(state)
      },
      useLocalTimezone: state.settings.timezone,
      createLists: state.settings.createLists,
      optimizeOnImport: state.project.isManaged &&
        (state.project.optimize?.onImport ?? true)
    })))
  }


  *importFromImage (path) {
    try {
      yield this.progress()

      let {
        basePath, store, density, db, templates, useLocalTimezone,
        optimizeOnImport
      } = this.options

      let { list: activeList } = this.action.payload
      let item
      let photos = []

      let image = yield call([Image, Image.open], {
        path,
        density,
        useLocalTimezone
      })

      yield * this.handleDuplicate(image)
      let data = yield * this.getMetadata(image, templates)

      let pageData = []

      if (optimizeOnImport) {
        while (!image.done) {
          let optimized = yield call([image, image.optimize])
          yield call(store.add, image)
          pageData.push({
            ...image.toJSON(),
            ...(optimized ? { page: 0 } : {})
          })
          image.next()
        }

        image.rewind()
      } else {
        yield call(store.add, image)
      }

      yield call(db.transaction, async tx => {
        item = await mod.item.create(tx, templates.item.id, data.item)

        while (!image.done) {
          let imageData = optimizeOnImport
            ? pageData[image.page]
            : image.toJSON()

          let photo = await mod.photo.create(tx,
            { basePath, template: templates.photo.id },
            {
              item: item.id,
              image: imageData,
              data: data.photo
            })

          if (activeList) {
            await mod.list.items.add(tx, activeList, [item.id])
            item.lists.push(activeList)
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
        yield fork(ImportCommand.consolidate, {
          cache: this.options.cache,
          image,
          photos: item.photos
        }))

    } catch (err) {
      if (err instanceof DuplicateError)
        info(`skipping duplicate "${path}"...`)
      else
        throw err
    }
  }

  *importFromJSON (data, rel) {
    let graph = yield call(normalize, data)

    if (graph.length > 1)
      yield this.progress({ total: graph.length - 1 })

    for (let item of eachItem(graph)) {
      yield * this.importJSONItem(item, rel)
    }
  }

  *importJSONItem (obj, rel) {
    try {
      let { db, basePath, templates, createLists } = this.options
      let { list: activeList } = this.action.payload
      let item
      let photos = []
      let selections = []
      let notes = []
      let transcriptions = []
      let tags
      let newLists = []

      yield this.progress()

      if (obj.tags.length) {
        tags = yield * this.findOrCreateTags(obj.tags)
      }

      let lists = createLists
        ? { ...(yield select(state => state.lists)) }
        : null

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

        if (lists) {
          let leafIds = await importLists(
            tx, obj.lists, lists, newLists)
          for (let listId of leafIds) {
            await mod.list.items.add(tx, listId, [item.id])
            item.lists.push(listId)
          }
        }

        if (activeList && !item.lists.includes(activeList)) {
          await mod.list.items.add(tx, activeList, [item.id])
          item.lists.push(activeList)
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
          await importTranscriptions(
            tx,
            obj.photos[i].transcriptions,
            photo,
            transcriptions
          )

          for (let s of obj.photos[i].selections) {
            let selection = await mod.selection.create(tx, {
              ...s,
              photo: photo.id,
              template: s.template || templates.selection.id
            })

            await importNotes(tx, s.notes, selection, notes)
            await importTranscriptions(
              tx,
              s.transcriptions,
              selection,
              transcriptions
            )

            photo.selections.push(selection.id)
            selections.push(selection)
          }

          item.photos.push(photo.id)

          photos.push(photo)
        }
      })

      this.result.push(item.id)
      this.newLists.push(...newLists)

      yield all([
        ...newLists.map(({ list, idx }) =>
          put(act.list.insert(list, { idx }))),
        put(act.note.insert(notes)),
        put(act.transcriptions.insert(transcriptions)),
        put(act.selection.insert(selections)),
        put(act.photo.insert(photos)),
        put(act.item.insert(item)),
        put(act.metadata.load([
          item.id,
          ...photos.map(p => p.id),
          ...selections.map(s => s.id)
        ]))
      ])

    } catch (err) {
      warn({ err }, 'skipping item due to import error')
    }
  }

  *findOrCreateTags (names) {
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

  get redo () {
    return (this.result?.length > 0) ?
      act.item.restore(this.result, { lists: this.newLists }) :
      null
  }

  get undo () {
    return (this.result?.length > 0) ?
      act.item.delete(this.result, { lists: this.newLists }) :
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

const importTranscriptions =
  async (db, transcriptions, parent, result = []) => {
    for (let { text, alto } of transcriptions) {
      let transcription = await mod.transcription.create(db, {
        parent: parent.id,
        data: alto,
        text
      })

      parent.transcriptions.push(transcription.id)
      result.push(transcription)
    }
    return result
  }

