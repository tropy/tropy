'use strict'

const React = require('react')
const { PureComponent } = React
const { CoverImage } = require('./cover-image')
const cx = require('classnames')
const { arrayOf, string, func, shape, number, object } =  require('prop-types')

class ItemDragPreview extends PureComponent {
  get classes() {
    return {
      'item': true,
      'drag-preview': true,
      'multiple': this.count > 1
    }
  }

  get item() {
    return this.props.items[0]
  }

  get count() {
    return this.props.items.length
  }

  render() {
    const { cache, photos, size, tags, onPhotoError } = this.props

    return (
      <div className={cx(this.classes)}>
        <CoverImage
          cache={cache}
          photos={photos}
          size={size}
          item={this.item}
          tags={tags}
          onError={onPhotoError}/>
        {this.count > 1 &&
          <div className="badge">{this.count}</div>
        }
      </div>
    )

  }

  static propTypes = {
    cache: string.isRequired,
    size: number.isRequired,
    tags: object.isRequired,
    photos: object.isRequired,
    items: arrayOf(shape({
      id: number.isRequired
    })).isRequired,
    onPhotoError: func.isRequired
  }

  static defaultProps = {
    size: 64
  }
}

module.exports = {
  ItemDragPreview
}
