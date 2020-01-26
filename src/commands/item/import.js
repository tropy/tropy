'use strict'

const { extname } = require('path')
const { all, call, fork, join, put, select } = require('redux-saga/effects')
const { ImportCommand } = require('../import')
const { DuplicateError } = require('../../common/error')
const { open, eachItem } = require('../../common/import')
const { info, warn } = require('../../common/log')
const { Image } = require('../../image')
const { fail } = require('../../dialog')
const act = require('../../actions')
const mod = require('../../models')

const { ITEM, PROJECT: { MODE } } = require('../../constants')

const {
  findTagIds,
  getItemTemplate,
  getPhotoTemplate
} = require('../../selectors')


class Import extends ImportCommand {
  *exec() {
    let files = yield call(this.getFilesToImport)

    if (files.length === 0)
      return []

    yield put(act.nav.update({ mode: MODE.PROJECT, query: '' }))
    yield* this.configure()

    // Subtle: push items to this.result early to support
    // undo after cancelled (partial) import!
    this.result = []
    this.backlog = []

    yield this.progress({ total: files.length })

    for (let file of files) {
      try {
        if ((/json(ld)?$/i).test(extname(file)))
          yield* this.importFromJSON(file)
        else
          yield* this.importFromImage(file)

      } catch (e) {
        warn({ stack: e.stack }, `failed to import "${file}"`)
        fail(e, this.action.type)
      }
    }

    if (this.backlog.length > 0) {
      yield join(this.backlog)
    }

    return this.result
  }

  *configure() {
    Object.assign(this.options, yield select(state => ({
      base: state.project.base,
      density: this.action.meta.density || state.settings.density,
      templates: {
        item: getItemTemplate(state),
        photo: getPhotoTemplate(state)
      },
      useLocalTimezone: state.settings.timezone
    })))
  }


  *importFromImage(path) {
    try {
      yield this.progress()

      let { base, density, db, templates, useLocalTimezone } = this.options
      let { list } = this.action.payload

      let item
      let photos = []
      let image = yield call(Image.open, {
        path,
        density,
        useLocalTimezone
      })

      yield* this.handleDuplicate(image)
      let data = yield* this.getMetadata(image, templates)

      yield call(db.transaction, async tx => {
        item = await mod.item.create(tx, templates.item.id, data.item)

        while (!image.done) {
          let photo = await mod.photo.create(tx,
            { base, template: templates.photo.id },
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

  *importFromJSON(path) {
    let graph = yield call(open, path)

    if (graph.length > 1)
      yield this.progress({ total: graph.length - 1 })

    for (let item of eachItem(graph)) {
      yield* this.paste(item)
    }
  }

  *paste(obj) {
    try {
      let { db, base } = this.options
      let { list } = this.action.payload
      let item
      let photos = []
      let selections = []
      //let notes = []
      let tags

      yield this.progress()

      if (obj.tags.length) {
        // TODO Find only by name! Drop missing tags!
        tags = yield select(state => findTagIds(state, obj.tags))
      }

      yield call(db.transaction, async tx => {
        item = await mod.item.create(tx, obj.template, obj.data)

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

          let photo = await mod.photo.create(tx, { base, template }, {
            item: item.id,
            image,
            data,
            position: i + 1
          })

          // TODO photo notes

          for (let j = 0; j < obj.photos[i].selections.length; ++j) {
            let selection = await mod.selection.create(tx, {
              photo: photo.id,
              ...obj.photos[i].selections[j]
            })

            // TODO selection notes

            photo.selections.push(selection.id)
            selections.push(selection)
          }

          item.photos.push(photo.id)
          photos.push(photo)
        }
      })

      this.result.push(item.id)

      yield all([
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


module.exports = {
  Import
}
