import fs from 'fs'
import { parse, resolve, win32 } from 'path'
import { call, put, select } from 'redux-saga/effects'
import { ImportCommand } from '../import'
import { fail, open, prompt } from '../../dialog'
import * as mod from '../../models'
import * as act from '../../actions'
import { PHOTO } from '../../constants'
import { Image } from '../../image'
import { info, warn } from '../../common/log'
import { blank } from '../../common/util'
import { getPhotosForConsolidation } from '../../selectors'



export class Consolidate extends ImportCommand {
  lookup = async (photo, paths = {}, checkFileSize) => {
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

  *resolve(photo) {
    let { meta } = this.action
    let path = yield call(this.lookup, photo, meta.paths, true)

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

    this.options.base = project.base
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

    let maxFail = 15
    let failures = 0

    for (let photo of photos) {
      try {
        yield this.progress()
        yield this.consolidate(photo, selections)

      } catch (e) {
        warn({ stack: e.stack }, `failed to consolidate photo ${photo.path}`)

        if (++failures < maxFail) {
          fail(e, this.action.type)
        }
      }
    }

    return this.result
  }

  *consolidate(photo, selections = {}) {
    try {
      let { meta } = this.action
      let { cache, db, overwrite, useLocalTimezone } = this.options
      let density = photo.density || this.options.density

      let {
        image,
        hasChanged,
        error
      } = yield call(Image.check, photo, {
        density,
        useLocalTimezone
      })

      var data
      var broken = (error != null)

      if (meta.force || hasChanged) {
        if (broken) {
          warn({ stack: error.stack }, `failed to open photo ${photo.path}`)

          let path = yield this.resolve(photo)
          if (path) {
            image = yield call(Image.open, {
              density,
              path,
              page: photo.page,
              protocol: 'file',
              useLocalTimezone
            })
          }
        }

        if (image) {
          broken = false
          hasChanged = (image.checksum !== photo.checksum) ||
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

            if (!this.options.isReadOnly) {
              yield call(mod.photo.save, db, data, {
                base: this.options.base
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
