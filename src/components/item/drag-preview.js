'use strict'

const React = require('react')
const { CoverImage } = require('./cover-image')
const cx = require('classnames')
const { arrayOf, string, func, shape, number, object } =  require('prop-types')

class ItemDragPreview extends React.PureComponent {
  get classes() {
    return ['item', 'drag-preview', 'center', {
      multiple: this.count > 1
    }]
  }

  get item() {
    return this.props.items[0]
  }

  get count() {
    return this.props.items.length
  }

  render() {
    return (
      <div className={cx(...this.classes)}>
        <CoverImage
          cache={this.props.cache}
          photos={this.props.photos}
          size={this.props.size}
          item={this.item}
          tags={this.props.tags}
          onError={this.props.onPhotoError}/>
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
