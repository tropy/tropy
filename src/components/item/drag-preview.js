import React from 'react'
import { CoverImage } from './cover-image'
import cx from 'classnames'
import { arrayOf, string, func, shape, number, object } from 'prop-types'

export class ItemDragPreview extends React.PureComponent {
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
