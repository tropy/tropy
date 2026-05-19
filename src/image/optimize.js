import { relative } from 'node:path'
import { warn } from '../common/log.js'
import { Image } from './image.js'


export async function optimizeAsset ({
  density,
  projectPath,
  quality,
  store,
  ...props
}) {
  let image = await Image.open({ ...props, density })

  try {
    let optimized = await image.optimize({ quality })
    await store.add(image)

    let updates = { path: relative(projectPath, image.path) }
    if (optimized) {
      updates.checksum = image.checksum
      updates.mimetype = image.mimetype
      updates.page = 0
      updates.size = image.size
    }
    return updates

  } catch (err) {
    warn({ err, url: image.url }, 'failed to optimize, copying original')

    if (image.original) {
      image.buffer = image.original.buffer
      image.path = image.original.path
      image.protocol = image.original.protocol
    }

    await image.check()

    if (image.hasChanged) return null

    await store.add(image)
    return { path: relative(projectPath, image.path) }
  }
}
