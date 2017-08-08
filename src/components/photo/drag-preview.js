'use strict'

const React = require('react')
const { PureComponent } = React
const { Thumbnail } = require('./thumbnail')
const cx = require('classnames')
const { get, pick } = require('../../common/util')
const { string, arrayOf, object, shape, number } = require('prop-types')

class PhotoDragPreview extends PureComponent {

  get classes() {
    return {
      'photo': true,
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

  get orientation() {
    return pick(get(this.props.photos, [this.item.id]), [
      'angle', 'mirror', 'orientation'
    ])
  }

  render() {
    const { cache, size } = this.props

    return (
      <div className={cx(this.classes)}>
        <Thumbnail {...this.orientation}
          id={this.item.id}
          size={size}
          cache={cache}/>
        {this.count > 1 &&
          <div className="badge">{this.count}</div>
        }
      </div>
    )

  }

  static propTypes = {
    cache: string.isRequired,
    photos: object.isRequired,
    size: number.isRequired,
    items: arrayOf(shape({
      id: number.isRequired
    })).isRequired
  }

  static defaultProps = {
    size: 64
  }
}

module.exports = {
  PhotoDragPreview
}
