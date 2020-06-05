'use strict'

const { call, put, select } = require('redux-saga/effects')
const { dirname } = require('path')
const { Command } = require('./command')
const { PROJECT } = require('../constants')
const { pick } = require('../common/util')
const act = require('../actions')
const mod = require('../models')


class Optimize extends Command {
  *exec() {
    let { db } = this.options

    yield call(db.clear)
    yield call(db.seq, conn =>
      mod.project.optimize(conn))
  }
}

Optimize.register(PROJECT.OPTIMIZE)


class Rebase extends Command {
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

Rebase.register(PROJECT.REBASE)


class Reindex extends Command {
  *exec() {
    let { meta } = this.action
    let { db } = this.options

    yield call(db.clear)

    yield call(db.seq, conn =>
      mod.project.reindex(conn, meta))
  }
}

Reindex.register(PROJECT.REINDEX)


class Save extends Command {
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

    yield put(act.project.update(payload, {
      ipc: payload.name != null || payload.isReadOnly != null
    }))

    this.undo = act.project.save(original)
  }
}

Save.register(PROJECT.SAVE)


module.exports = {
  Optimize,
  Rebase,
  Reindex,
  Save
}
