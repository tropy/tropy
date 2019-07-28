'use strict'

const { call, put, select } = require('redux-saga/effects')
const { dirname } = require('path')
const { Command } = require('./command')
const { PROJECT } = require('../constants')
const { pick } = require('../common/util')
const act = require('../actions')
const mod = require('../models')


class Rebase extends Command {
  static get ACTION() { return PROJECT.REBASE }

  *exec() {
    let { db, id } = this.options
    let { project } = yield select()

    // Temporary: only toggle between absolute and project-relative!
    let base = (project.base) ? null : dirname(project.file)

    yield call(db.transaction, async tx => {
      await mod.project.save(tx, { id, base: (base) ? 'project' : null })
      await mod.photo.rebase(tx, base, project.base)
    })

    yield put(act.project.update({ base }))
    this.undo = act.project.rebase()
  }
}

class Reindex extends Command {
  static get ACTION() {
    return PROJECT.REINDEX
  }

  *exec() {
    let { meta } = this.action
    let { db } = this.options

    yield call(db.clear)

    yield call(db.seq, conn =>
      mod.project.reindex(conn, meta))
  }
}

class Save extends Command {
  static get ACTION() { return PROJECT.SAVE }

  *exec() {
    let { payload } = this.action
    let { db, id } = this.options

    let original = yield select(state =>
      pick(state.project, Object.keys(payload)))

    let doRebase = ('base' in payload && payload.base !== original.base)

    yield call(db.transaction, async tx => {
      await mod.project.save(tx, { id, ...payload })

      if (doRebase) {
        await mod.photo.rebase(tx, payload.base, this.original.base)
      }
    })

    yield put(act.project.update(payload))
    this.undo = act.project.save(original)
  }
}

module.exports = {
  Rebase,
  Reindex,
  Save
}
