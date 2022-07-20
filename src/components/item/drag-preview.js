import cx from 'classnames'
import { CoverImage } from './cover-image.js'
import { arrayOf, shape, number, object } from 'prop-types'

export function ItemDragPreview({
  item,
  size,
  photos,
  tags
}) {
  let items = item.items
  let count = items.length

  return (
    <div className={cx('item', 'drag-preview', 'center', {
      multiple: count > 1
    })}>
      <CoverImage
        photos={photos}
        size={size}
        item={items[0]}
        tags={tags}/>
      {count > 1 &&
        <div className="badge">{count}</div>
      }
    </div>
  )
}

ItemDragPreview.propTypes = {
  size: number.isRequired,
  tags: object.isRequired,
  photos: object.isRequired,
  item: shape({
    items: arrayOf(object).isRequired
  }).isRequired
}

ItemDragPreview.defaultProps = {
  size: 64
}
