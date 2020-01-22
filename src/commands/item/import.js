'use strict'

const { all, call, fork, join, put, select } = require('redux-saga/effects')
const { ImportCommand } = require('../import')
const { DuplicateError } = require('../../common/error')
const { info, warn } = require('../../common/log')
const { fail } = require('../../dialog')
const act = require('../../actions')
const mod = require('../../models')

const { ITEM, PROJECT: { MODE } } = require('../../constants')

const {
  getItemTemplate,
  getPhotoTemplate
} = require('../../selectors')

class Import extends ImportCommand {
  *exec() {
    let files = yield call(this.getFilesToImport)

    if (files.length === 0)
      return []

    yield put(act.nav.update({ mode: MODE.PROJECT, query: '' }))

    Object.assign(this.options, yield select(state => ({
      base: state.project.base,
      templates: {
        item: getItemTemplate(state),
        photo: getPhotoTemplate(state)
      }
    })))

    // Subtle: push items to this.result early to support
    // undo after cancelled (partial) import!
    this.result = []
    this.backlog = []

    for (let i = 0, total = files.length; i < files.length; ++i) {
      yield put(act.activity.update(this.action, { total, progress: i + 1 }))
      yield* this.importImage(files[i])
    }

    if (this.backlog.length > 0) {
      yield join(this.backlog)
    }

    return this.result
  }

  *importImage(file) {
    try {
      let { base, cache, db, templates } = this.options
      let { list } = this.action.payload

      let item
      let photos = []
      let image = yield* this.openImage(file)

      yield* this.handleDuplicate(image)
      let data = yield* this.getMetadata(image, templates)

      yield call(db.transaction, async tx => {
        item = await mod.item.create(tx, templates.item.id, data.item)

        while (!image.done) {
          let photo = await mod.photo.create(tx,
            { base, template: templates.photo.id },
            { item: item.id, image, data: data.photo })

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
          cache,
          image,
          item.photos))

    } catch (e) {
      if (e instanceof DuplicateError) {
        info(`skipping duplicate "${file}"...`)
        return
      }

      warn({ stack: e.stack }, `failed to import "${file}"`)
      fail(e, this.action.type)
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
