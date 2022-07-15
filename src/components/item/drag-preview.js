import cx from 'classnames'
import { CoverImage } from './cover-image.js'
import { arrayOf, string, func, shape, number, object } from 'prop-types'

export function ItemDragPreview({
  cache,
  item,
  size,
  photos,
  tags,
  onPhotoError
}) {
  let items = item.items
  let count = items.length

  return (
    <div className={cx('item', 'drag-preview', 'center', {
      multiple: count > 1
    })}>
      <CoverImage
        cache={cache}
        photos={photos}
        size={size}
        item={items[0]}
        tags={tags}
        onError={onPhotoError}/>
      {count > 1 &&
        <div className="badge">{count}</div>
      }
    </div>
  )
}

ItemDragPreview.propTypes = {
  cache: string.isRequired,
  size: number.isRequired,
  tags: object.isRequired,
  photos: object.isRequired,
  item: shape({
    items: arrayOf(object).isRequired
  }).isRequired,
  onPhotoError: func.isRequired
}

ItemDragPreview.defaultProps = {
  size: 64
}
