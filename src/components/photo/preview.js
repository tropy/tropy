import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import { useQuickLookTitle, useQuickLookVisible } from '../quicklook.js'
import { useWindow } from '../../hooks/use-window.js'
import { Cache } from '../../common/cache.js'
import { Rotation } from '../../common/iiif.js'
import { warn } from '../../common/log.js'
import { cssFilter } from '../../esper/filter/css.js'
import { getSelectedPhoto } from '../../selectors/index.js'
import { selectCachePrefix } from '../../selectors/project.js'

const getPreview = (photo, cache) => {
  let rotation = Rotation.fromExifOrientation(photo.orientation).add(photo)

  return {
    src: Cache.url(cache, 'full', photo),
    title: photo.filename,
    size: rotation.size(photo),
    rotation,
    filter: cssFilter(photo)
  }
}

// Previews the selected photo. While hidden, only fits
// the window to the photo, so that it can be shown right away.
export function PhotoPreview () {
  let { quicklook } = useWindow()
  let cache = useSelector(selectCachePrefix)
  let photo = useSelector(getSelectedPhoto)
  let isVisible = useQuickLookVisible()

  let next = (photo == null) ? null : getPreview(photo, cache)
  let hasPhoto = next != null
  let { width, height } = next?.size ?? {}

  useEffect(() => {
    if (!hasPhoto)
      quicklook.fit(null)
    else if (!isVisible)
      quicklook.fit({ width, height })
  }, [quicklook, hasPhoto, isVisible, width, height])

  return (isVisible && hasPhoto) ? <PhotoLayers next={next}/> : null
}

// Loads the next photo in a hidden layer and swaps it in
// once decoded and the window is fitted to its size.
// Until then, the last photo stays.
function PhotoLayers ({ next }) {
  let { quicklook } = useWindow()
  let [shown, setShown] = useState(null)
  let pending = useRef()

  let isLoaded = next.src === shown?.src
  let current = isLoaded ? next : shown

  useQuickLookTitle(current?.title)

  let { width, height } = next.size

  // Refits when the shown photo changes size, e.g. when rotated.
  useEffect(() => {
    if (isLoaded)
      quicklook.fit({ width, height })
  }, [quicklook, isLoaded, width, height])

  let src = isLoaded ? null : next.src
  let fit = useEffectEvent(() => quicklook.fit({ width, height }))
  let swap = useEffectEvent(() => setShown(next))

  useEffect(() => {
    if (src == null) return

    let isCancelled = false

    let load = async () => {
      try {
        await pending.current.decode()
        if (isCancelled) return

        await fit()
        if (!isCancelled) swap()

      } catch (err) {
        if (!isCancelled) warn({ err }, `quicklook: failed to load ${src}`)
      }
    }

    load()

    return () => {
      isCancelled = true
    }
  }, [src])

  // Keyed in one list: the loaded layer keeps its element when shown.
  return [current, isLoaded ? null : next].filter(Boolean).map(layer => (
    <img
      key={layer.src}
      ref={layer === current ? undefined : pending}
      className={cx('iiif', `rot-${layer.rotation.format('x')}`, {
        'rotated': !layer.rotation.isHorizontal,
        'quicklook-pending': layer !== current
      })}
      src={layer.src}
      style={{ filter: layer.filter }}/>
  ))
}
