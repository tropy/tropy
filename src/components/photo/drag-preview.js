'use strict'

const React = require('react')
const { Thumbnail } = require('./thumbnail')
const cx = require('classnames')
const { pick } = require('../../common/util')
const { arrayOf, func, number, shape, string } = require('prop-types')


class PhotoDragPreview extends React.PureComponent {
  get classes() {
    return ['photo', 'drag-preview', 'center', {
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
      <div className={cx(this.classes)}>
        <Thumbnail
          {...pick(this.item, Thumbnail.keys)}
          cache={this.props.cache}
          size={this.props.size}/>
        {this.count > 1 &&
          <div className="badge">{this.count}</div>
        }
      </div>
    )

  }

  static propTypes = {
    cache: string.isRequired,
    size: number.isRequired,
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
  PhotoDragPreview
}
