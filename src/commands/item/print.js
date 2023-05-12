import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { ipcRenderer as ipc } from 'electron'
import { call, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { ITEM } from '../../constants/index.js'
import { getPrintableItems } from '../../selectors/print.js'
import { Cache } from '../../common/cache.js'
import { addOrientation } from '../../common/iiif.js'
import { info, warn } from '../../common/log.js'
import { mkdtmp } from '../../common/os.js'
import { pMap } from '../../common/util.js'
import Esper from '../../esper/index.js'
import { open } from '../../image/sharp.js'

async function prepForPrinting(photo, _, {
  cache,
  prefs,
  tmp,
  maxSize
}) {
  try {
    let src = Cache.url(cache.root, 'full', photo)
    let [img, { width, height }] = await loadImage(src, photo)

    // TODO check for duplicates before prep?
    let path = join(tmp, `${photo.checksum}.jpg`)

    if (prefs.optimize && maxSize) {
      img.resize({
        [width > height ? 'width' : 'height']: maxSize,
        kernel: 'lanczos2',
        withoutEnlargement: true
      })
    }

    await img.jpeg({
      quality: prefs.optimize ? 80 : 100,
      chromaSubsampling: '4:4:4'
    }).toFile(path)

    photo.print = path

  } catch (e) {
    warn({ stack: e.stack, photo }, 'failed to prepare photo for printing')
  }
}

async function loadImage(src, photo, image = photo) {
  let { buffer, ...raw } = await Esper.instance.extract(src, {
    ...image,
    ...addOrientation(image, photo)
  })

  let img = await open(buffer, { raw })
  return [img, raw]
}

export class Print extends Command {
  *exec() {
    try {
      let { cache } = this.options
      let { pdf, landscape } = this.action.meta
      let concurrency = 4

      let [prefs, project, items] = yield select(state => ([
        state.settings.print,
        state.project.id,
        getPrintableItems(state)
      ]))

      if (prefs.photos) {
        var tmp = yield call(mkdtmp, ITEM.PRINT)
        let photos = items.flatMap(it => it.photos)

        info({ tmp, prefs }, `prepare ${photos.length} photo(s) for printing`)
        yield call(pMap, photos, prepForPrinting, { concurrency }, {
          cache,
          maxSize: 2137, // For A4/Letter at 300ppi
          tmp,
          prefs
        })
      }

      if (items.length) {
        yield call(ipc.invoke, 'print', {
          pdf,
          landscape,
          ...prefs,
          project,
          items
        })
      }
    } finally {
      if (tmp)
        rm(tmp, { recursive: true })
    }
  }
}

Print.register(ITEM.PRINT)
