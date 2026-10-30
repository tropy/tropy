import { useSelector } from 'react-redux'
import cx from 'classnames'
import { useQuickLookContent } from '../quicklook.js'
import { Cache } from '../../common/cache.js'
import { Rotation } from '../../common/iiif.js'
import { cssFilter } from '../../esper/filter/css.js'
import { getSelectedPhoto } from '../../selectors/index.js'
import { selectCachePrefix } from '../../selectors/project.js'

export function PhotoPreview () {
  let cache = useSelector(selectCachePrefix)
  let photo = useSelector(getSelectedPhoto)

  let rotation = photo &&
    Rotation.fromExifOrientation(photo.orientation).add(photo)

  useQuickLookContent(photo && {
    title: photo.filename,
    ...rotation.size(photo)
  })

  if (photo == null)
    return null

  return (
    <img
      className={cx('iiif', `rot-${rotation.format('x')}`, {
        rotated: !rotation.isHorizontal
      })}
      src={Cache.url(cache, 'full', photo)}
      style={{
        filter: cssFilter(photo)
      }}/>
  )
}
