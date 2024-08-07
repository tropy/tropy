import fs from 'node:fs'
import { basename, parse, resolve, win32 } from 'node:path'
import { cpus } from 'node:os'
import { call, put, select } from 'redux-saga/effects'
import { parallel } from '../../sagas/util.js'
import { ImportCommand } from '../import.js'
import { fail, open, prompt } from '../../dialog.js'
import * as mod from '../../models/index.js'
import * as act from '../../actions/index.js'
import { PHOTO } from '../../constants/index.js'
import { Image } from '../../image/image.js'
import { info, warn } from '../../common/log.js'
import { blank } from '../../common/util.js'
import { getPhotosForConsolidation } from '../../selectors/index.js'


async function lookup(photo, paths = {}, checkFileSize) {
  let { dir, base } = win32.parse(photo.path)

  for (let [from, to] of Object.entries(paths)) {
    let rel = win32.relative(from, dir)

    for (let x of to) {
      try {
        let candidate = resolve(x, rel, base)
        let { size } = await fs.promises.stat(candidate)
        let isMatch = !checkFileSize || (size === photo.size)

        if (isMatch) {
          return candidate
        } else {
          info({ path: candidate }, 'skipped consolidation candidate')
        }
      } catch (e) {
        if (e.code === 'ENOENT') return
        if (e.code === 'ENAMETOOLONG') return
        throw e
      }
    }
  }
}

export class Consolidate extends ImportCommand {
  *resolve(photo) {
    let { meta } = this.action
    let path = yield call(lookup, photo, meta.paths, true)

    if (!path && meta.prompt) {
      try {
        this.suspend()

        path = (yield call(open.image, {
          message: photo.path
        }))?.[0]

        if (path) {
          let from = win32.parse(photo.path)
          let to = parse(path)

          if (from.dir !== to.dir && from.base === to.base) {
            let res = yield call(prompt, 'photo.consolidate')
            if (res.ok) {
              yield put(act.photo.consolidate(null, {
                paths: { [from.dir]: [to.dir] }
              }))
            }
          }
        }
      } finally {
        this.resume()
      }
    }

    return path
  }

  *exec() {
    let { payload, meta } = this.action

    let [project, photos, selections, settings] = yield select(state => [
      state.project,
      getPhotosForConsolidation(state, payload),
      state.selections,
      state.settings
    ])

    this.options.basePath = project.basePath
    this.options.isReadOnly = project.isReadOnly
    this.options.density = meta.density || settings.density
    this.options.overwrite = true
    this.useLocalTimezone = settings.timezone

    this.result = []

    if (blank(photos))
      return this.result

    yield this.progress({ total: photos.length })

    yield put(act.photo.bulk.update([
      photos.map(photo => photo.id),
      { consolidating: true }
    ]))

    let maxFail = 3
    let failures = 0

    let concurrency = meta.prompt ? 1 : meta.concurrency ||
      Math.max(1, cpus().length)

    let self = this

    yield parallel(photos, function* (photo) {
      try {
        yield self.progress()
        yield self.consolidate(photo, selections)

      } catch (e) {
        warn({ stack: e.stack }, `failed to consolidate photo ${photo.path}`)

        if (++failures < maxFail) {
          fail(e, self.action.type)
        }
      }
    }, { concurrency })

    return this.result
  }

  *consolidate(photo, selections = {}) {
    try {
      let { meta } = this.action
      let { cache, db, overwrite, useLocalTimezone, store } = this.options
      let density = photo.density || this.options.density

      let image = yield call([Image, Image.check], {
        ...photo,
        density,
        useLocalTimezone
      })

      var data
      var broken = (image.error != null)

      if (meta.force || image.hasChanged) {
        if (broken) {
          warn({
            stack: image.error.stack
          }, `failed to open photo ${photo.path}`)

          let path = yield this.resolve(photo)
          if (path) {
            image.protocol = 'file'
            image.path = path

            yield call([image, image.open], {
              density,
              page: photo.page,
              useLocalTimezone
            })
          }
        }

        if (image.buffer) {
          broken = false

          yield call(store.add, image)

          let hasChanged = (image.checksum !== photo.checksum) ||
            (image.path !== photo.path)

          if (meta.force || hasChanged) {
            yield call(cache.consolidate, photo.id, image, {
              overwrite
            })

            for (let id of photo.selections) {
              if (id in selections) {
                yield call(cache.consolidate, id, image, {
                  overwrite,
                  selection: selections[id]
                })
              }
            }

            data = { id: photo.id, ...image.toJSON() }

            if (basename(photo.path) === image.basename)
              delete data.filename

            if (!this.options.isReadOnly) {
              yield call(mod.photo.save, db, data, {
                basePath: this.options.basePath
              })
            }
          }

          this.result.push(photo.id)
        }
      }

    } catch (e) {
      broken = true
      throw e

    } finally {
      yield put(act.photo.update({
        id: photo.id,
        broken,
        consolidated: Date.now(),
        consolidating: false,
        ...data
      }))
    }
  }
}

Consolidate.register(PHOTO.CONSOLIDATE)
